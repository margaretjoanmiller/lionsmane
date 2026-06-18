-- +goose Up
CREATE TABLE IF NOT EXISTS Users (
    Id UUID PRIMARY KEY DEFAULT uuidv7(),
    Sub VARCHAR UNIQUE NOT NULL,
    Datecreated TIMESTAMPTZ
);

-- +goose Down
DROP TABLE Users;
