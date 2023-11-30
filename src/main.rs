/*
 * Birdie - Split group expenses using the minimal number of transactions
 *
 * Copyright © 2023 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * Birdie is free software: you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * Birdie is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * Birdie. If not, see <https://www.gnu.org/licenses/>.
 */

use shuttle_axum::{AxumService, ShuttleAxum};
use shuttle_runtime::CustomError;
use shuttle_secrets::SecretStore;
use sqlx::PgPool;

#[shuttle_runtime::main]
async fn axum(
    #[shuttle_shared_db::Postgres] pool: PgPool,
    #[shuttle_secrets::Secrets] secret_store: SecretStore,
) -> ShuttleAxum {
    let frontend_dir = if std::env::var("BIRDIE_LOCAL").is_err() {
        let dir = "./frontend";
        birdie::unpack_frontend(secret_store, dir).await?;
        dir
    } else {
        "./js/build"
    };

    birdie::migrate(&pool).await.map_err(CustomError::new)?;

    birdie::app(pool, frontend_dir).await.map(AxumService::from)
}
