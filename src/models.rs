use serde::{Deserialize, Serialize};
use sqlx::types::chrono::{DateTime, Utc};
use sqlx::types::Decimal;
use sqlx::FromRow;

#[derive(Serialize, FromRow)]
pub struct Outing {
    pub outing_id: i32,
    pub created_at: DateTime<Utc>,
    pub name: String,
}

#[derive(Deserialize)]
pub struct OutingNew {
    pub name: String,
}

#[derive(Serialize, FromRow)]
pub struct Person {
    pub person_id: i32,
    pub name: String,
}

#[derive(Deserialize)]
pub struct PersonNew {
    pub name: String,
}

#[derive(Serialize, FromRow)]
pub struct Expense {
    pub expense_id: i32,
    pub created_at: DateTime<Utc>,
    pub amount: Decimal,
    pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct ExpenseNew {
    pub amount: Decimal,
    pub description: Option<String>,
}
