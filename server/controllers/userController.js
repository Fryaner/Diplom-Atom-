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
            const {lastName, firstName, patronymic, email, phone, login, password} = req.body;
            const userData = await userService.registration(lastName, firstName, patronymic, email, phone, login, password);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData);
        } catch (e) {
            return res.json({message: e.message})
        }
    }

    async delete(req, res, next) {
        try {
            const {id, password} = req.body;
            const deleteUser = await userService.delete(id, password);
            return res.json(deleteUser);
        } catch (e) {
            return res.json({message: e.message});
        }
    }

    async login(req, res, next) {
        try {
            const {email, login, phone, password} = req.body;
            const userData = await userService.login(email, login, phone, password);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData)
        } catch (e) {
            return res.json({message: e.message});
        }
    }

    async edit(req,res) {
        try {
            const {id, email, login, phone,  lastName, firstName, patronymic, password, newPassword, isActivated} = req.body;
            const editUser = await userService.edit(id, email, login, phone,  lastName, firstName, patronymic, password, newPassword, isActivated);
            return res.json(editUser);
        } catch (e) {
            return res.json({message: e.message});
        }
    }

    async logout(req, res, next) {
        try {
            const {refreshToken} = req.cookies;
            const token = await userService.logout(refreshToken);
            res.clearCookie('refreshToken');
            return res.json(token);
        } catch (e) {
            return res.json(e.message);
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
    
    async getUser(req, res, next) {
        try {
            const {id} = req.params;
            const user = await userService.getUser(id);
            return res.json(user);
        } catch (e) {
            return res.json(e.message)
        }
    }

   async addRole(req, res, next) {
    try {
        const {userId, roleId} = req.body;
        const newRole = await userService.addRole(userId, roleId);

        return res.json(newRole);
    } catch (e) {
        return res.json(e.message);
    }
   }


   async removeRole(req, res, next) {
    try {
        const {userId, roleId} = req.body;
        const removeRole = await userService.removeRole(userId, roleId);

        return res.json(removeRole);
    } catch (e) {
        return res.json(e.message);
    }
   }

    async getAllRoles(req, res, next) {
        try { 
            const roles = await userService.getAllRole();
            return res.json(roles);
        } catch (e) {
            return res.json(e.message);
        }
    }
    
}

module.exports = new UserController();