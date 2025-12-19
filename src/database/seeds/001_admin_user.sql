INSERT INTO
    users (
        email,
        password_hash,
        name,
        native_language,
        current_level,
        target_level
    )
VALUES (
        'heliobsb.almeida@icloud.com',
        '$2b$10$NscUXFgQhHLdYEShFSESWOZscBovbYYcjzHgquAgUcWfYpufZi7FO',
        'Lucas',
        'pt-BR',
        'B1',
        'C1'
    )
ON CONFLICT (email) DO NOTHING
RETURNING
    id;

INSERT INTO
    user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE
    u.email = 'heliobsb.almeida@icloud.com'
    AND r.name = 'admin'
ON CONFLICT DO NOTHING;