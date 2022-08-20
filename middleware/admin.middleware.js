module.exports = async (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next()
    }

    try {
        const user = req.user
        console.log(user.role)
        if (!user?.role) {
            return res.status(403).json({message: 'Нет доступа'})
        }
        next()

    } catch (e) {
        res.status(403).json({message: 'Нет доступа'})
    }
}
