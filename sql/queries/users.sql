-- name: GetUser :one
SELECT id FROM users
WHERE sub = $1 LIMIT 1;
