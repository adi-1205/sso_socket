
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        username: DataTypes.STRING,
        by_google: {
            type: DataTypes.BOOLEAN,
            default: false
        },
    }, {
        paranoid: true,
        timestamps: true,
        freezeTableName: true,
        tableName: 'User',
    })

    User.associate = function (models) {
        this.hasMany(models.Room, {
            foreignKey: "creator_user_id",
            onDelete: 'cascade',
            hooks: true,
        });
    }
    return User
}