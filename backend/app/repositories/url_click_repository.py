from datetime import datetime

from sqlalchemy import String, cast, func, or_
from sqlmodel import Session, select

from app.models.url_click_model import URLClick


class URLClickRepository:
    def __init__(self, session: Session):
        self.session = session

    def create_click(
            self,
            url_id:int,
            ip_address:str,
            user_agent:str,
            referrer:str | None = None
    ) -> URLClick:
        click = URLClick(
            url_id=url_id,
            ip_address=ip_address,
            user_agent=user_agent,
            referrer=referrer
        )

        self.session.add(click)
        self.session.commit()
        self.session.refresh(click)

        return click

    def get_clicks_by_url_id(
        self,
        url_id: int,
        limit: int,
        offset: int,
        search: str | None,
        sort_by: str,
        sort_direction: str,
    ) -> tuple[list[URLClick], int]:
        conditions = [URLClick.url_id == url_id]
        if search:
            search_term = f"%{search}%"
            searchable_columns = [
                cast(column, String).ilike(search_term)
                for column in URLClick.__table__.columns
            ]
            conditions.append(or_(*searchable_columns))

        sort_column = URLClick.__table__.columns[sort_by]
        sort_expression = sort_column.desc() if sort_direction == "desc" else sort_column.asc()
        total = self.session.exec(
            select(func.count())
            .select_from(URLClick)
            .where(*conditions)
        ).one()
        statement = (
            select(URLClick)
            .where(*conditions)
            .order_by(sort_expression, URLClick.id.desc())
        )
        records = list(
            self.session.exec(statement.offset(offset).limit(limit)).all()
        )

        return records, total

    def get_click_summary(
        self, url_id: int
    ) -> tuple[int, datetime | None, int]:
        statement = select(
            func.count(URLClick.id),
            func.max(URLClick.clicked_at),
            func.count(func.distinct(URLClick.ip_address)),
        ).where(URLClick.url_id == url_id)
        total, last_click_at, unique_visitors = self.session.exec(statement).one()
        return total, last_click_at, unique_visitors

    def get_click_count_by_url_id(self,url_id:int) -> int:
        statement = (select(func.count()).select_from(URLClick).where(URLClick.url_id == url_id))

        return self.session.exec(statement).one()

    def get_multiple_click_counts_by_url_id(self,url_ids:list[int]) -> dict[int,int]:
        if not url_ids:
            return []
        
        statement = (select(URLClick.url_id,func.count(URLClick.id)).where(URLClick.url_id.in_(url_ids)).group_by(URLClick.url_id))

        result =  self.session.exec(statement).all()

        return { url_id : count  for url_id,count in result}