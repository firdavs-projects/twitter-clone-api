module.exports = async (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next()
    }

    try {
        if (!req?.user) {
            return res.status(401).json({message: 'Пользователь не авторизован'})
        }

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({message: 'Нет доступа', userRole: req?.user.role})
        }
        next()

    } catch (e) {
        res.status(403).json({message: 'Нет доступа'})
    }
}
