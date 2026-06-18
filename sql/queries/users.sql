-- name: GetUser :one
SELECT id FROM users
WHERE sub = $1 LIMIT 1;

-- name: CreateUser :exec
INSERT INTO users (sub, datecreated) VALUES ($1, now())
ON CONFLICT (sub) DO NOTHING;
