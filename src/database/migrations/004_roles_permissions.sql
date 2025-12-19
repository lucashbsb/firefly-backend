CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    role_id UUID NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions (role_id);

CREATE INDEX idx_role_permissions_permission ON role_permissions (permission_id);

CREATE INDEX idx_user_roles_user ON user_roles (user_id);

CREATE INDEX idx_user_roles_role ON user_roles (role_id);

CREATE INDEX idx_permissions_resource ON permissions (resource);

CREATE INDEX idx_permissions_code ON permissions (code);

INSERT INTO
    roles (name, description, is_system)
VALUES (
        'admin',
        'Full system access',
        true
    ),
    (
        'teacher',
        'Can manage lessons and students',
        true
    ),
    (
        'student',
        'Regular student access',
        true
    )
ON CONFLICT (name) DO NOTHING;

INSERT INTO
    permissions (
        code,
        name,
        description,
        resource,
        action
    )
VALUES (
        'users.list',
        'List Users',
        'View all users',
        'users',
        'list'
    ),
    (
        'users.view',
        'View User',
        'View user details',
        'users',
        'view'
    ),
    (
        'users.create',
        'Create User',
        'Create new users',
        'users',
        'create'
    ),
    (
        'users.update',
        'Update User',
        'Update user data',
        'users',
        'update'
    ),
    (
        'users.delete',
        'Delete User',
        'Delete users',
        'users',
        'delete'
    ),
    (
        'roles.list',
        'List Roles',
        'View all roles',
        'roles',
        'list'
    ),
    (
        'roles.manage',
        'Manage Roles',
        'Create/update/delete roles',
        'roles',
        'manage'
    ),
    (
        'roles.assign',
        'Assign Roles',
        'Assign roles to users',
        'roles',
        'assign'
    ),
    (
        'permissions.list',
        'List Permissions',
        'View all permissions',
        'permissions',
        'list'
    ),
    (
        'permissions.manage',
        'Manage Permissions',
        'Create/update/delete permissions',
        'permissions',
        'manage'
    ),
    (
        'lessons.view',
        'View Lessons',
        'View lesson content',
        'lessons',
        'view'
    ),
    (
        'lessons.start',
        'Start Lessons',
        'Start a lesson session',
        'lessons',
        'start'
    ),
    (
        'lessons.submit',
        'Submit Answers',
        'Submit lesson answers',
        'lessons',
        'submit'
    ),
    (
        'reports.view_own',
        'View Own Reports',
        'View own progress reports',
        'reports',
        'view_own'
    ),
    (
        'reports.view_all',
        'View All Reports',
        'View all users reports',
        'reports',
        'view_all'
    ),
    (
        'ai.settings',
        'AI Settings',
        'Configure AI settings',
        'ai',
        'settings'
    ),
    (
        'ai.use',
        'Use AI',
        'Use AI features',
        'ai',
        'use'
    ),
    (
        'admin.dashboard',
        'Admin Dashboard',
        'Access admin dashboard',
        'admin',
        'dashboard'
    ),
    (
        'admin.settings',
        'System Settings',
        'Manage system settings',
        'admin',
        'settings'
    )
ON CONFLICT (code) DO NOTHING;

INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE
    r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE
    r.name = 'teacher'
    AND p.code IN (
        'users.list',
        'users.view',
        'lessons.view',
        'lessons.start',
        'lessons.submit',
        'reports.view_own',
        'reports.view_all',
        'ai.settings',
        'ai.use'
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE
    r.name = 'student'
    AND p.code IN (
        'lessons.view',
        'lessons.start',
        'lessons.submit',
        'reports.view_own',
        'ai.settings',
        'ai.use'
    )
ON CONFLICT DO NOTHING;