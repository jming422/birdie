/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
use aws_sdk_s3::{output::GetObjectOutput, Client, Credentials};

use shuttle_service::{error::CustomError, SecretStore};
use sqlx::PgPool;

async fn get_client(pool: &PgPool) -> Result<Client, shuttle_service::Error> {
    let aws_ak = pool.get_secret("AWS_ACCESS_KEY_ID").await?;
    let aws_sk = pool.get_secret("AWS_SECRET_ACCESS_KEY").await?;

    let config = aws_config::from_env()
        .credentials_provider(Credentials::new(
            aws_ak,
            aws_sk,
            None,
            None,
            "ShuttleSecrets",
        ))
        .region("us-west-1")
        .load()
        .await;

    Ok(Client::new(&config))
}

pub async fn download_object(
    pool: &PgPool,
    bucket: impl Into<String>,
    key: impl Into<String>,
) -> Result<GetObjectOutput, shuttle_service::Error> {
    Ok(get_client(pool)
        .await?
        .get_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await
        .map_err(CustomError::new)?)
}
