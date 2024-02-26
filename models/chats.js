
module.exports = (sequelize, DataTypes) => {
    const Chat = sequelize.define('Chat', {
        message: DataTypes.TEXT,
        sender_username: DataTypes.STRING
    }, {
        timestamps: true,
        freezeTableName: true,
        tableName: 'Chat',
    })

    Chat.associate = function (models) {
        this.belongsTo(models.Room, {
            foreignKey: "room_id",
        });
        this.belongsTo(models.User, {
            foreignKey: "sender_id",
        });
        this.hasMany(models.MessageSeenBy, {
            foreignKey: 'chat_id',
            onDelete: 'cascade',
            hooks: true,
        });
    }
    return Chat
}