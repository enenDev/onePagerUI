import csv
import io
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.models.action_log import ActionLog
from app.models.login_log import LoginLog
from app.models.user_details import UserDetails
from app.repositories.user_tracking_repository import user_tracking_repository
from app.schemas.user_tracking_schema import (
    ActionLogCreate,
    LoginLogCreate,
    UserDetailsOut,
    UserDetailsUploadResponse,
    ActionLogBackfillResponse,
)
from app.utils.helpers import generate_uuid, utcnow

VALID_ROLES: Dict[str, str] = {
    "CSP": "CSP",
    "CBD": "CBD",
    "GENERAL": "General",
}

ROLE_PRECEDENCE: Dict[str, int] = {
    "CSP": 1,
    "CBD": 2,
    "General": 3,
}


class UserTrackingService:

    @staticmethod
    def normalize_user_records(raw_rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        valid_records: Dict[str, Dict[str, Any]] = {}

        for row in raw_rows:
            raw_email = row.get("email")
            raw_role = row.get("role")
            raw_market = row.get("market")

            if not raw_email or not raw_role or not raw_market:
                continue

            email = str(raw_email).strip().lower()
            role_str = str(raw_role).strip()
            market = str(raw_market).strip()

            if not email or not role_str or not market:
                continue

            role_upper = role_str.upper()
            if role_upper not in VALID_ROLES:
                continue

            canonical_role = VALID_ROLES[role_upper]

            if email not in valid_records:
                valid_records[email] = {
                    "email": email,
                    "role": canonical_role,
                    "market": market,
                }
            else:
                existing_role = valid_records[email]["role"]
                existing_prio = ROLE_PRECEDENCE.get(existing_role, 999)
                new_prio = ROLE_PRECEDENCE.get(canonical_role, 999)

                if new_prio < existing_prio:
                    # Higher privilege role wins (CSP > CBD > General)
                    valid_records[email]["role"] = canonical_role
                    valid_records[email]["market"] = market
                elif new_prio == existing_prio:
                    # Same role priority, later row updates market
                    valid_records[email]["market"] = market

        return list(valid_records.values())

    def record_login(self, db: Session, payload: LoginLogCreate) -> LoginLog:
        """Create a new login_log entry."""
        log = LoginLog(
            id=generate_uuid(),
            user_email=payload.user_email.strip() if payload.user_email else None,
            role=payload.role.strip() if payload.role else None,
            login_time=utcnow(),
        )
        return user_tracking_repository.create_login_log(db, log)

    def record_action(self, db: Session, payload: ActionLogCreate) -> ActionLog:
        """
        Create a new action_log entry.
        Action can be VIEW, EXPORT, DRAFT, TRACK, or any custom action string.
        """
        log = ActionLog(
            id=generate_uuid(),
            pager_id=payload.pager_id.strip() if payload.pager_id else None,
            user_email=payload.user_email.strip() if payload.user_email else None,
            role=payload.role.strip() if payload.role else None,
            market=payload.market.strip() if payload.market else None,
            action=payload.action.strip() if payload.action else None,
            date_time=utcnow(),
        )
        return user_tracking_repository.create_action_log(db, log)

    def get_user_details(self, db: Session, email: str) -> UserDetails:
        """
        Fetch a user_details record by email.
        Raises 404 if the user is not found.
        """
        cleaned_email = email.strip().lower()
        user = user_tracking_repository.get_user_by_email(db, cleaned_email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User details not found for email: {cleaned_email}",
            )
        return user

    async def upload_user_details_csv(
        self, db: Session, file: UploadFile
    ) -> UserDetailsUploadResponse:
        """
        Parse an uploaded CSV file containing columns:
        - email_id (or email)
        - role
        - market
        Performs normalization, validation, and role-precedence deduplication before UPSERT:
        - Removes rows with empty email, role, or market.
        - Validates role is strictly CSP, CBD, or General.
        - Converts email addresses to lowercase.
        - Resolves duplicates by selecting highest privilege role (CSP > CBD > General).
        - Performs an UPSERT into user_details.
        """
        if not file.filename.lower().endswith((".csv", ".txt")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV files (.csv) are accepted.",
            )

        content_bytes = await file.read()
        if not content_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded CSV file is empty.",
            )

        # Decode with utf-8-sig (handles Excel BOM) or utf-8
        try:
            content_text = content_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            try:
                content_text = content_bytes.decode("utf-8")
            except UnicodeDecodeError:
                content_text = content_bytes.decode("latin-1")

        csv_reader = csv.DictReader(io.StringIO(content_text))
        if not csv_reader.fieldnames:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not parse headers from CSV file.",
            )

        # Normalize field names to detect email_id / email, role, market
        header_map = {}
        for raw_header in csv_reader.fieldnames:
            if not raw_header:
                continue
            cleaned = raw_header.strip().lower().replace(" ", "_")
            if cleaned in ("email_id", "email", "emailid", "user_email", "useremail"):
                header_map["email"] = raw_header
            elif cleaned in ("role", "user_role", "userrole"):
                header_map["role"] = raw_header
            elif cleaned in ("market", "user_market", "region"):
                header_map["market"] = raw_header

        if "email" not in header_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV must contain an 'email_id' or 'email' column.",
            )

        raw_rows = []
        for row in csv_reader:
            raw_rows.append({
                "email": row.get(header_map["email"]) if "email" in header_map else None,
                "role": row.get(header_map["role"]) if "role" in header_map else None,
                "market": row.get(header_map["market"]) if "market" in header_map else None,
            })

        # Apply normalization, validation, and role-precedence deduplication
        rows_to_process = self.normalize_user_records(raw_rows)

        if not rows_to_process:
            return UserDetailsUploadResponse(
                message="No valid user records to process after normalization.",
                total_processed=0,
                inserted=0,
                updated=0,
                users=[],
            )

        inserted_count, updated_count, processed_records = await run_in_threadpool(
            user_tracking_repository.bulk_upsert_user_details, db, rows_to_process
        )

        return UserDetailsUploadResponse(
            message="User details processed successfully.",
            total_processed=len(processed_records),
            inserted=inserted_count,
            updated=updated_count,
            users=[UserDetailsOut.model_validate(u) for u in processed_records],
        )

    async def backfill_past_action_logs(
        self, db: Session, skip_existing: bool = True
    ) -> ActionLogBackfillResponse:
        """
        Backfill action_log entries for past pagers:
        - action='DRAFT' for all pagers
        - action='TRACK' for unique pagers with tracks in pager, pillar, or pillar_initiative
        """
        total, draft_cnt, track_cnt, skipped = await run_in_threadpool(
            user_tracking_repository.backfill_past_action_logs,
            db,
            skip_existing,
        )
        total_created = draft_cnt + track_cnt
        return ActionLogBackfillResponse(
            message=f"Backfilled {total_created} action logs ({draft_cnt} DRAFT, {track_cnt} TRACK) successfully.",
            total_pagers=total,
            draft_logs_created=draft_cnt,
            track_logs_created=track_cnt,
            logs_created=total_created,
            skipped_existing=skipped,
        )

    # Alias for backward compatibility
    async def backfill_past_draft_action_logs(
        self, db: Session, skip_existing: bool = True
    ) -> ActionLogBackfillResponse:
        return await self.backfill_past_action_logs(db, skip_existing)
user_tracking_service = UserTrackingService()