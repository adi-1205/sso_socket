
module.exports = (sequelize, DataTypes) => {
    const Room = sequelize.define('Room', {
        room_name: DataTypes.STRING,
        access_code: DataTypes.STRING,
        creator_user_name: DataTypes.STRING,
        slug: {
            type: DataTypes.STRING,
            unique: true
        },
        joined_users: {
            type: DataTypes.JSON,
            default: '[]'
        }
    }, {
        paranoid: true,
        timestamps: true,
        freezeTableName: true,
        tableName: 'Room',
    })

    Room.prototype.addUserToRoom = function (user_id, username) {
        let users = JSON.parse(this.joined_users) || []
        let existingUser = users.find((u) => u.user_id === user_id)
        if (!existingUser) {
            users.push({ user_id, username })
            this.setDataValue('joined_users', users)
            return this.save()
        }
    }

    Room.associate = function (models) {
        this.hasMany(models.Chat, {
            foreignKey: "room_id",
            onDelete: 'cascade',
            hooks: true,
        });
        this.belongsTo(models.User, {
            foreignKey: "room_id"
        })
    }
    return Room
}