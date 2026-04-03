from fastapi import APIRouter
from app.api.endpoints import auth, pois, claims, sources, media, stats, scraping, users

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(pois.router, prefix="/pois", tags=["pois"])
api_router.include_router(claims.router, prefix="/claims", tags=["claims"])
api_router.include_router(sources.router, prefix="/sources", tags=["sources"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(scraping.router, prefix="/scraping", tags=["scraping"])
