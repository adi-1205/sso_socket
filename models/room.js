
module.exports = (sequelize, DataTypes) => {
    const Room = sequelize.define('Room', {
        room_name: DataTypes.STRING,
        access_code: DataTypes.STRING,
        creator_user_name: DataTypes.STRING,
        slug: {
            type: DataTypes.STRING,
            unique: true
        }
    }, {
        paranoid: true,
        timestamps: true,
        freezeTableName: true,
        tableName: 'Room',
    })

    Room.assocoiate = function (models) {
        this.belongsTo(models.User, {
            foreignKey: "room_id"
        });
    }
    return Room
}