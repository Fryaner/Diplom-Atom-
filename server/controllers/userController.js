const userService = require('../service/user-service');
const {validationResult} = require('express-validator');
const ApiError = require('../error/apiError');

class UserController {
    async registration(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.badRequest('Ошибка при валидции', errors.array()));
            }
            const {lastName, firstName, email, login, password} = req.body;
            const userData = await userService.registration(lastName, firstName, email, login, password);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData)
        } catch (e) {
            return res.json(e.message)
        }
    }

    async login(req, res, next) {
        try {
            const {email, login, password} = req.body;
            const userData = await userService.login(email, login, password);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData)
        } catch (e) {
            next(e);
        }
    }

    async logout(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            const token = await userService.logout(refreshToken);
            res.clearCookie('refreshToken');
            return res.json(token);
        } catch (e) {
            next(e);
        }
    }

    async refresh(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            const userData = await userService.refresh(refreshToken);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData)
        } catch (e) {
            return res.json(e.message);
        }
    }

    async activate(req, res, next) {
        try {
            const activationLink = req.params.link;
            await userService.activate(activationLink);
            return res.redirect(process.env.CLIENT_URL)
        } catch (e) {
            next(e);
        }
    }

    async getUsers(req, res, next) {
        try {
            const users = await userService.getAllUsers();
            return res.json(users);
        } catch (e) {
            return res.json(e.message)
        }
    }

    // async addRole(req, res, next) {
    //     try {
    //         const {id, role} = req.body;
    //         const addRoleUser = await userService.addRole(id, role);
    //         return res.json(addRoleUser);
    //     } catch (e) {
    //         return res.json(e.message);
    //     }
    // }

    // async removeRole(req, res, next) {
    //     try { const {id, role} = req.body;
    //       const deleteRoleUser = await userService.removeRole(id, role);
    //       return res.json(deleteRoleUser);
    //     } catch (e) {
    //         return res.json(e.message);
    //     }
    // }
    
}

module.exports = new UserController();