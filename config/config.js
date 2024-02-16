require('dotenv').config();

CONFIG = {}

CONFIG.phase = 'development'

CONFIG.db_dialect =  process.env.DB_DIALECT
CONFIG.db_host =  process.env.DB_HOST
CONFIG.db_username =  process.env.DB_USER
CONFIG.db_password = process.env.DB_PASSWORD
CONFIG.db_database =  process.env.DB_NAME

