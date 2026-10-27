from abc import ABC, abstractmethod

class StorageService(ABC):
    @abstractmethod
    def upload_file(self, file_obj, file_name: str) -> str:
        pass

    @abstractmethod
    def generate_signed_url(self, file_name: str, expiration: int = 900) -> str:
        pass
