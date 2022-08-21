const {Router} = require('express')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const {check, validationResult} = require('express-validator')
const User = require('../models/User')
const Role = require('../models/Role')
const authMiddleware = require('../middleware/auth.middleware')
const adminMiddleware = require('../middleware/admin.middleware')
const Tweet = require("../models/Tweet");
const router = Router()

router.post(
    '/register',
    [
        check('username', 'Некорректное имя пользователя').exists(),
        check('firstName', 'Некорректное имя пользователя').exists(),
        check('lastName', 'Некорректное имя пользователя').exists(),
        check('password', 'Минимальная длина пароля 6 символов')
            .isLength({min: 6}),
    ],
    authMiddleware,
    // adminMiddleware,
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Некорректные данные при регистрации'
                })
            }

            const {username, password, firstName, lastName, role} = req.body

            const candidate = await User.findOne({username})

            if (candidate) {
                return res.status(400)
                    .json({message: 'Такой пользователь уже существует'})
            }
            const hashedPassword = await bcrypt.hash(password, 12)

            const defaultRole = await Role.findOne({role})
            if (!defaultRole) {
                return res.status(400).json({
                    message: 'Некорректные данные при регистрации, нет такой роли'
                })
            }

            const user = new User({
                username,
                password: hashedPassword,
                firstName,
                lastName,
                role: defaultRole._id
            })
            await user.save()

            await Role.updateOne({_id: defaultRole._id}, {$push: {users: user._id}})

            const newUser = await User.findOne({username})
            const token = jwt.sign(
                {userId: newUser._id, role: defaultRole.role},
                config.get('jwtSecret'),
                {expiresIn: '744h'}
            )

            res.status(201).json({message: 'Администратор создан', token, userId: user.id, role: defaultRole.role})

        } catch (e) {
            console.log(e)
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

router.post(
    '/role',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {
            const {role} = req.body

            const candidate = await Role.findOne({role})
            if (candidate) {
                return res.status(400)
                    .json({message: 'Такая роль уже существует'})
            }

            const newRole = new Role({role})
            await newRole.save()
            res.status(201).json({message: 'Роль создан', newRole})

        } catch (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }

    }
)

router.put(
    '/role/:id',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {
            const id = req.params.id;
            const {role} = req.body

            await Role.updateOne({_id: id}, {$set: {role}})
            res.status(201).json({message: 'Роль изменён', role})

        } catch (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }

    }
)

router.get(
    '/role',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {
            const roles = await Role.find()
            res.json({roles})
        } catch (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }

    }
)

router.delete(
    '/role/:id',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {
            const id = req.params.id;
            await Role.deleteOne({_id: id})
            res.status(201).json({message: 'Роль удалён'})
        } catch (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }

    }
)

module.exports = router
