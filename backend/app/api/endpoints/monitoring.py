from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Any, Dict
from app.api import deps
from app.schemas.response import ResponseModel
from app.schemas.monitoring import MonitoredSiteCreate, MonitoredSiteOut, MonitoredArticleOut
from app.services import monitoring as monitoring_service

router = APIRouter()

@router.get("/sites", response_model=ResponseModel[List[MonitoredSiteOut]])
def read_sites(
    db: Session = Depends(deps.get_db),
    current_user: deps.User = Depends(deps.get_current_user)
) -> Any:
    """
    Get all active whitelisted monitoring sites.
    """
    sites = monitoring_service.get_sites(db)
    return ResponseModel(data=sites, message="Sites retrieved successfully")

@router.post("/sites", response_model=ResponseModel[MonitoredSiteOut])
def add_site(
    *,
    db: Session = Depends(deps.get_db),
    site_in: MonitoredSiteCreate,
    current_user: deps.User = Depends(deps.get_current_journalist)
) -> Any:
    """
    Add a new whitelisted news site / domain to monitor.
    """
    try:
        site = monitoring_service.create_site(db, name=site_in.name, url=site_in.url)
        return ResponseModel(data=site, message="Monitored site added successfully")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Site already registered or invalid inputs")

@router.delete("/sites/{site_id}", response_model=ResponseModel[MonitoredSiteOut])
def remove_site(
    *,
    db: Session = Depends(deps.get_db),
    site_id: int,
    current_user: deps.User = Depends(deps.get_current_journalist)
) -> Any:
    """
    Remove a whitelisted site from monitoring database.
    """
    site = monitoring_service.delete_site(db, id=site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Monitored site not found")
    return ResponseModel(data=site, message="Monitored site removed successfully")

@router.get("/articles", response_model=ResponseModel[List[MonitoredArticleOut]])
def read_articles(
    db: Session = Depends(deps.get_db),
    current_user: deps.User = Depends(deps.get_current_user)
) -> Any:
    """
    Get all scraped audited articles and their extracted verified claims.
    """
    articles = monitoring_service.get_articles(db)
    return ResponseModel(data=articles, message="Audited articles feed retrieved successfully")

def _async_scan_wrapper(db_session: Session):
    try:
        monitoring_service.run_monitoring_scan(db_session)
    except Exception as e:
        print(f"Background monitoring scan failed: {e}")
    finally:
        db_session.close()

@router.post("/scan", response_model=ResponseModel[Dict[str, str]])
def trigger_site_scan(
    *,
    db: Session = Depends(deps.get_db),
    background_tasks: BackgroundTasks,
    current_user: deps.User = Depends(deps.get_current_journalist)
) -> Any:
    """
    Triggers an autonomous scanning and cross-referencing audit cycle on background tasks.
    """
    # Create an isolated DB session for background thread safety
    from app.db.session import SessionLocal
    bg_db = SessionLocal()
    
    background_tasks.add_task(_async_scan_wrapper, bg_db)
    return ResponseModel(
        data={"status": "scanning", "message": "Autonomous background scanning and claim cross-referencing triggered."},
        message="Verification scan initialized successfully"
    )
