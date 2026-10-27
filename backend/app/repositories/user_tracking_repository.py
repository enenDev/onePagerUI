"""
Repository for user tracking operations:
- LoginLog
- ActionLog
- UserDetails (upsert)
"""

from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime
from sqlalchemy import select, insert, update
from sqlalchemy.orm import Session

from app.models.action_log import ActionLog
from app.models.login_log import LoginLog
from app.models.user_details import UserDetails
from app.utils.helpers import utcnow


class UserTrackingRepository:

    def create_login_log(self, db: Session, log: LoginLog) -> LoginLog:
        """Insert a LoginLog record and commit."""
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def create_action_log(self, db: Session, log: ActionLog) -> ActionLog:
        """Insert an ActionLog record and commit."""
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def get_user_by_email(self, db: Session, email: str) -> Optional[UserDetails]:
        """Find a UserDetails record by primary key email."""
        return db.query(UserDetails).filter(UserDetails.email == email).first()

    def upsert_user_details(
        self, db: Session, email: str, role: Optional[str], market: Optional[str]
    ) -> Tuple[UserDetails, bool]:
        """
        Upsert a UserDetails row.
        If email exists -> update role, market, last_updated_at.
        If email does not exist -> insert new record.
        Returns (UserDetails, was_inserted).
        Caller handles commit or batch commit.
        """
        user = self.get_user_by_email(db, email)
        now = utcnow()
        if user:
            if role is not None:
                user.role = role
            if market is not None:
                user.market = market
            user.last_updated_at = now
            db.flush()
            return user, False
        else:
            new_user = UserDetails(
                email=email,
                role=role,
                market=market,
                created_at=now,
                last_updated_at=now,
            )
            db.add(new_user)
            db.flush()
            return new_user, True

    def list_users(self, db: Session) -> List[UserDetails]:
        """Return all user_details rows."""
        return db.query(UserDetails).order_by(UserDetails.email).all()

    def bulk_upsert_user_details(
        self,
        db: Session,
        rows: List[Dict[str, Any]],
        chunk_size: int = 1000,
    ) -> Tuple[int, int, List[Dict[str, Any]]]:
        """
        Efficiently upsert user details in batches.
        Handles thousands of rows without individual round-trips or timeouts.

        Parameters:
        - db: SQLAlchemy Session
        - rows: list of dicts with 'email', 'role', 'market'
        - chunk_size: batch size for IN queries and DML statements

        Returns:
        - (inserted_count, updated_count, processed_records)
        """
        if not rows:
            return 0, 0, []

        # Deduplicate rows by email; if role precedence applies (CSP > CBD > General), higher privilege wins
        role_precedence = {"CSP": 1, "CBD": 2, "General": 3}
        unique_rows: Dict[str, Dict[str, Any]] = {}
        for r in rows:
            email = r["email"]
            if email in unique_rows:
                new_role = r.get("role")
                existing_role = unique_rows[email].get("role")
                new_prio = role_precedence.get(new_role, 999) if new_role else 999
                exist_prio = role_precedence.get(existing_role, 999) if existing_role else 999
                if new_prio < exist_prio:
                    unique_rows[email]["role"] = new_role
                    if r.get("market") is not None:
                        unique_rows[email]["market"] = r["market"]
                elif new_prio == exist_prio:
                    if r.get("role") is not None:
                        unique_rows[email]["role"] = r["role"]
                    if r.get("market") is not None:
                        unique_rows[email]["market"] = r["market"]
            else:
                unique_rows[email] = {
                    "email": email,
                    "role": r.get("role"),
                    "market": r.get("market"),
                }

        all_emails = list(unique_rows.keys())
        existing_map: Dict[str, Tuple[Optional[str], Optional[str], Optional[datetime]]] = {}

        # 1. Fetch existing users in chunks
        for i in range(0, len(all_emails), chunk_size):
            chunk = all_emails[i : i + chunk_size]
            results = db.execute(
                select(
                    UserDetails.email,
                    UserDetails.role,
                    UserDetails.market,
                    UserDetails.created_at,
                ).where(UserDetails.email.in_(chunk))
            ).all()
            for row in results:
                existing_map[row[0]] = (row[1], row[2], row[3])

        now = utcnow()
        to_insert: List[Dict[str, Any]] = []
        to_update: List[Dict[str, Any]] = []
        processed_records: List[Dict[str, Any]] = []

        # 2. Partition into inserts and updates
        for email, user_data in unique_rows.items():
            new_role = user_data["role"]
            new_market = user_data["market"]

            if email in existing_map:
                old_role, old_market, old_created_at = existing_map[email]
                final_role = new_role if new_role is not None else old_role
                final_market = new_market if new_market is not None else old_market

                to_update.append({
                    "email": email,
                    "role": final_role,
                    "market": final_market,
                    "last_updated_at": now,
                })
                processed_records.append({
                    "email": email,
                    "role": final_role,
                    "market": final_market,
                    "created_at": old_created_at,
                    "last_updated_at": now,
                })
            else:
                to_insert.append({
                    "email": email,
                    "role": new_role,
                    "market": new_market,
                    "created_at": now,
                    "last_updated_at": now,
                })
                processed_records.append({
                    "email": email,
                    "role": new_role,
                    "market": new_market,
                    "created_at": now,
                    "last_updated_at": now,
                })

        # 3. Execute bulk inserts and updates within transaction
        try:
            if to_insert:
                for i in range(0, len(to_insert), chunk_size):
                    db.execute(insert(UserDetails), to_insert[i : i + chunk_size])

            if to_update:
                for i in range(0, len(to_update), chunk_size):
                    db.execute(update(UserDetails), to_update[i : i + chunk_size])

            db.commit()
        except Exception:
            db.rollback()
            raise

        return len(to_insert), len(to_update), processed_records

    def backfill_past_action_logs(
        self,
        db: Session,
        skip_existing: bool = True,
    ) -> Tuple[int, int, int, int]:
        """
        Iterates all pager records and creates ActionLog entries:
        - action='DRAFT' for each pager
        - action='TRACK' for each unique pager that has a track in pager, pillar, or pillar_initiative
        """
        from app.models.pager import Pager
        from app.models.pillar import Pillar
        from app.models.pillar_initiative import PillarInitiative
        from sqlalchemy import func
        from app.utils.helpers import generate_uuid

        pagers = db.query(Pager).all()
        total_pagers = len(pagers)
        if total_pagers == 0:
            return 0, 0, 0, 0

        # Pre-fetch user_details to map (email -> (role, market)) in a single query
        user_rows = db.query(UserDetails.email, UserDetails.role, UserDetails.market).all()
        user_map = {u[0]: {"role": u[1], "market": u[2]} for u in user_rows if u[0]}

        # Pre-fetch pager_ids that have a track in Pillar or PillarInitiative
        pillar_track_pager_ids = {
            r[0] for r in db.query(Pillar.pager_id)
            .filter(Pillar.pillar_track.is_not(None), Pillar.pillar_track != "")
            .all()
            if r[0]
        }
        initiative_track_pager_ids = {
            r[0] for r in db.query(PillarInitiative.pager_id)
            .filter(PillarInitiative.initiative_track.is_not(None), PillarInitiative.initiative_track != "")
            .all()
            if r[0]
        }

        # Pre-fetch existing (pager_id, action) logs if skip_existing is enabled
        existing_pairs = set()
        if skip_existing:
            existing_rows = (
                db.query(ActionLog.pager_id, func.upper(ActionLog.action))
                .filter(ActionLog.pager_id.is_not(None), ActionLog.action.is_not(None))
                .all()
            )
            existing_pairs = {(r[0], r[1]) for r in existing_rows}

        new_logs = []
        draft_count = 0
        track_count = 0
        skipped_count = 0

        for p in pagers:
            creator_email = p.created_by.strip() if p.created_by else None
            u_info = user_map.get(creator_email, {}) if creator_email else {}
            role = u_info.get("role") or p.created_by_role or "General"
            market = u_info.get("market") or p.market
            dt = p.created_at or utcnow()

            # 1. DRAFT log for each pager
            if skip_existing and (p.pager_id, "DRAFT") in existing_pairs:
                skipped_count += 1
            else:
                new_logs.append(
                    ActionLog(
                        id=generate_uuid(),
                        pager_id=p.pager_id,
                        user_email=creator_email,
                        role=role,
                        market=market,
                        date_time=dt,
                        action="DRAFT",
                    )
                )
                draft_count += 1

            # 2. TRACK log for each unique pager that has track
            has_track = bool(p.track and p.track.strip()) or (p.pager_id in pillar_track_pager_ids) or (p.pager_id in initiative_track_pager_ids)
            if has_track:
                if skip_existing and (p.pager_id, "TRACK") in existing_pairs:
                    skipped_count += 1
                else:
                    new_logs.append(
                        ActionLog(
                            id=generate_uuid(),
                            pager_id=p.pager_id,
                            user_email=creator_email,
                            role=role,
                            market=market,
                            date_time=dt,
                            action="TRACK",
                        )
                    )
                    track_count += 1

        if new_logs:
            db.add_all(new_logs)
            db.commit()

        return total_pagers, draft_count, track_count, skipped_count

    def backfill_past_draft_action_logs(
        self,
        db: Session,
        skip_existing: bool = True,
    ) -> Tuple[int, int, int]:
        total, draft_cnt, _, skipped = self.backfill_past_action_logs(db, skip_existing)
        return total, draft_cnt, skipped



user_tracking_repository = UserTrackingRepository()