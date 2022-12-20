const {Router} = require('express')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const {check, validationResult} = require('express-validator')
const User = require('../models/User')
const Tweet = require('../models/Tweet')
const Role = require('../models/Role')
const authMiddleware = require('../middleware/auth.middleware')
const adminMiddleware = require('../middleware/admin.middleware')
const router = Router()

router.post(
    '/user',
    [
        check('username', 'Некорректное имя пользователя').exists(),
        check('firstName', 'Некорректное имя пользователя').exists(),
        check('lastName', 'Некорректное имя пользователя').exists(),
        check('password', 'Минимальная длина пароля 6 символов')
            .isLength({min: 6}),
    ],
    authMiddleware,
    adminMiddleware,
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
            const role = await Role.findById(id)
            if (String(role._id) === String('630082ea0bd55d35a4d5bda5')) {
                return res.status(400).json({
                    message: 'Эту роль нельзя удалить',
                })
            }
            if (role.users.length) {
                return res.status(400).json({
                    message: 'У роли есть пользователи, сначала переназначьте роли пользователям',
                    role: role.role,
                    users: role.users
                })
            }
            await Role.deleteOne({_id: id})
            res.status(201).json({message: '', role})
        } catch (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

router.get(
    '/users',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const users = await User.find()
            res.json(users)

        } catch (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }

    }
)

router.put(
    '/user/:id',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const id = req.params.id;
            const {roleId} = req.body;

            const role = await Role.findById(roleId)
            const user = await User.findById(id)

            if (!user || !role) {
                return res.status(404)
                    .json({message: 'Роль или пользователь не найдены'})
            }

            await Role.updateOne({_id: roleId}, {$push: {id}})
            await User.updateOne({_id: id}, {$set: {role: roleId}})

            res.status(201).json({message: 'Роль пользователя изменён'})

        } catch (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

router.post(
    '/user/:id/block',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const id = req.params.id;
            const user = await User.findById(id)

            if (!user ) {
                return res.status(404)
                    .json({message: 'Пользователь не найден'})
            }

            await User.updateOne({_id: id}, {$set: {blocked: true}})
            res.status(201).json({message: 'Пользователь заблокирован'})

        } catch (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

router.delete(
    '/user/:id/block',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const id = req.params.id;
            const user = await User.findById(id)

            if (!user ) {
                return res.status(404)
                    .json({message: 'Пользователь не найден'})
            }

            await User.updateOne({_id: id}, {$set: {blocked: false}})
            res.status(201).json({message: 'Пользователь разблокирован'})

        } catch (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

router.delete(
    '/user/:id',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            await User.deleteOne({_id: req.params.id})
            await Tweet.deleteMany({user: req.params.id})
            res.status(201).json({message: 'Профиль успешно удален'})
        } catch (e) {
            console.log(e)
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

router.delete('/tweet/:id',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const tweetId = req.params.id
            const tweet = await Tweet.findById(tweetId)

            if (!tweet) {
                return res.status(404).json({message: 'Твит не найден'})
            }
            const user = await User.findById(tweet.user)

            const tweets = user.tweets.filter(i => String(i) !== String(tweet._id))
            await User.updateOne({tweets}, {$set: {tweets}})

            await Tweet.deleteOne({_id: tweetId});
            res.json({message: 'Твит удалён администратором'})

        } catch
            (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

module.exports = router
