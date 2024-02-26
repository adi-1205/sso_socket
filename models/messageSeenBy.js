module.exports = (sequelize, DataTypes) => {
    const MessageSeenBy = sequelize.define('MessageSeenBy', {
        chat_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        username: DataTypes.STRING
    }, {
        freezeTableName: true,
        tableName: 'MessageSeenBy',
    });

    return MessageSeenBy;
};