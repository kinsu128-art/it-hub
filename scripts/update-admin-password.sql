-- Update admin password to 'admin123'
-- Bcrypt hash generated with cost 10
USE dk_it;
GO

UPDATE users
SET password_hash = '$2a$10$rOEYz4KZ9YKFGPw8LKsvLO7YVgFqXx.Rl1RZ9GZ3vXGJ0mZKFBXsW'
WHERE username = 'admin';
GO

PRINT 'Admin password updated successfully!';
PRINT 'Username: admin';
PRINT 'Password: admin123';
GO
