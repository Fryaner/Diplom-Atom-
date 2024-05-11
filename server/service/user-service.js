const {User} = require('../models/models');
const {Role} = require('../models/models');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mail-service');
const tokenService = require('./token-service');
const ApiError = require('../error/apiError');

class UserService {
    async registration(lastName, firstName, email, login, password) {
        const candidateEmail = await User.findOne({where: {email}});
        const candidateLogin = await User.findOne({where: {login}});
        const userRole = await Role.findOne({name: 'USER'});
        if (candidateEmail) {
            throw ApiError.badRequest(`Пользователь с почтовым адресом ${email} уже существует`);
        }
        if (candidateLogin) {
            throw ApiError.badRequest(`Пользователь с таким логином - ${login} уже существует`);
        }
        const hashPassword = await bcrypt.hash(password, 3);
        const activationLink = uuid.v4();
        const user = await User.create({lastName, firstName, email, login, password: hashPassword, activationLink, roles: [userRole.name]});
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/user/activate/${activationLink}`);
        const tokens = tokenService.generateTokens({id: user.id, email: user.email, lastName: user.lastName, firstName: user.firstName});
        await tokenService.saveToken(user.id, tokens.refreshToken);

        return {
            ...tokens,
            user: {
                email: user.email, 
                lastName: user.lastName, 
                firstName: user.firstName,
                login: user.login,
                password: user.password,
                roles: user.roles,
            }
        }
    }
    async activate(activation) {
        const user = await User.findOne({where: {activationLink: activation}});
        if (!user) {
            throw ApiError.badRequest('Неккоретная ссылка активации');
        }
        user.isActivated = true;
        await user.save();
    }

    async login(email, login, password) {
        const user = await User.findOne({where: {email}});
        if (!user) {
            throw ApiError.badRequest('Пользователь не найден')
        }
        const isPassEquals = await bcrypt.compare(password, user.password);
        if (!isPassEquals) {
            throw ApiError.badRequest('Некорректный пароль');
        }
        const tokens = tokenService.generateTokens({email: user.email, lastName: user.lastName, firstName: user.firstName});

        await tokenService.saveToken(user.id, tokens.refreshToken);

        return {
            ...tokens,
            user: {
                email: user.email, 
                lastName: user.lastName, 
                firstName: user.firstName,
                login: user.login,
                password: user.password,
            }
        }
    }

    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.unauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken);

        if (!userData || !tokenFromDb) {
            throw ApiError.unauthorizedError();
        }
        const user = await User.findOne({id: userData.id});
        const tokens = tokenService.generateTokens({email: user.email, lastName: user.lastName, firstName: user.firstName});

        await tokenService.saveToken(user.id, tokens.refreshToken);

        return {
            ...tokens,
            user: {
                email: user.email, 
                lastName: user.lastName, 
                firstName: user.firstName,
                login: user.login,
                password: user.password,
            }
        }

    }

    async getAllUsers() {
        const users = await User.findAll();
        return users;
    }
}

module.exports = new UserService();