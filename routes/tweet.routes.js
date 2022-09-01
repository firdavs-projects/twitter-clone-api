const {Router} = require('express')
const User = require('../models/User')
const Tweet = require('../models/Tweet')
const authMiddleware = require('../middleware/auth.middleware')
const router = Router()
const cloudinary = require("cloudinary");
const formidable = require("formidable");

// get all
router.get('/all', authMiddleware, async (req, res) => {
        try {

            const tweets = await Tweet.find({commentToTweetId: undefined})
                .populate('user', ['firstName', 'lastName', 'username', 'avatar'])
                .populate('likes', ['firstName', 'lastName', 'username', 'avatar'])
                // .where('commentToTweetId').gte(undefined)
                // .populate('tweets')
                // .populate('likes')
                // .populate('commentToTweetId')
            res.json({tweets})

        } catch
            (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

// get by subscriptions
router.get('/subscriptions', authMiddleware, async (req, res) => {
        try {
            const userId = req.user.userId
            const user = await User.findById(userId)

            const tweets = await Tweet.find({user: user.subscriptions, commentToTweetId: null})
                .populate('user', ['firstName', 'lastName', 'username', 'avatar'])
                .populate('likes', ['firstName', 'lastName', 'username', 'avatar'])
            // .populate('tweets')
            // .populate('likes')
            // .populate('commentToTweetId')

            res.json({tweets})

        } catch
            (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

// // get by user id
// router.get('/user/:id', authMiddleware, async (req, res) => {
//         try {
//             const userId = req.params.id
//             const user = await User.findById(userId)
//             if (!user) {
//                 return res.status(400).json({
//                     message: 'Пользователь не найден'
//                 })
//             }
//
//             const tweets = await Tweet.find({_id: user.tweets})
//                 .populate('user', ['firstName', 'lastName', 'username', 'avatar'])
//                 // .populate('tweets')
//                 .populate('likes', ['firstName', 'lastName', 'username', 'avatar'])
//                 // .populate('commentToTweetId')
//
//             res.json({tweets})
//
//         } catch
//             (e) {
//             res.status(500)
//                 .json({message: 'Что-то пошло не так, попробуйте снова'})
//         }
//     }
// )

// get by user username
router.get('/user/:username', authMiddleware, async (req, res) => {
        try {
            const username = req.params.username
            const user = await User.find({username})
            if (!user) {
                return res.status(400).json({
                    message: 'Пользователь не найден'
                })
            }

            const tweets = await Tweet.find({_id: user.tweets})
                .populate('user', ['firstName', 'lastName', 'username', 'avatar'])
                // .populate('tweets')
                .populate('likes', ['firstName', 'lastName', 'username', 'avatar'])
            // .populate('commentToTweetId')

            res.json({tweets})

        } catch
            (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)


// get by current user
router.get('/', authMiddleware, async (req, res) => {
        try {
            const user = await User.findById(req.user.userId)

            if (!user) {
                return res.status(400).json({
                    message: 'Пользователь не найден'
                })
            }

            const tweets = await Tweet.find({_id: user.tweets})
                .populate('user', ['firstName', 'lastName', 'username', 'avatar'])
                // .populate('tweets')
                .populate('likes', ['firstName', 'lastName', 'username', 'avatar'])
                // .populate('commentToTweetId')
            res.json({tweets})

        } catch
            (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

// get by id
router.get('/:id', authMiddleware, async (req, res) => {
        try {
            const user = await User.findById(req.user.userId)
            if (!user) {
                return res.status(400).json({
                    message: 'Пользователь не найден'
                })
            }

            const id = req.params.id;
            const tweet = await Tweet.findById(id)
                .populate('user', ['firstName', 'lastName', 'username', 'avatar'])
                .populate('tweets')
                .populate('likes', ['firstName', 'lastName', 'username', 'avatar'])
                .populate('commentToTweetId')

            if (!tweet) {
                return res.status(404).json({message: "Твит не найден"})
            }
            res.json({tweet})

        } catch
            (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

// create
const createTweet = async (userId, fields, result, callback) => {
    const image = result?.secure_url ?? '';
    const {text, commentToTweetId} = fields;
    const mainTweet = await Tweet.findById(commentToTweetId)
    const tweet = new Tweet({
        user: userId,
        text,
        ...(image && {image}),
        ...(mainTweet && {commentToTweetId})
    })
    await tweet.save()
    await User.updateOne({_id: userId}, {$push: {tweets: tweet._id}})

    if (mainTweet) {
        await Tweet.updateOne({_id: commentToTweetId}, {$push: {tweets: tweet._id}})
    }

    return callback(null, tweet);
}

router.post('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
        if (!user) {
            return res.status(400).json({
                message: 'Пользователь не найден'
            })
        }

        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            if (err) {return res.status(500)}

            if (files?.file?.filepath) {
                cloudinary.v2.uploader.upload(
                    files.file.filepath,
                    { public_id: files.file.newFilename },
                    async (error, result) => {
                        if (error) {return res.status(500)}
                        createTweet(
                            req.user.userId,
                            fields,
                            result,
                            (err, tweet) => {
                                if (err) {return res.status(500)}
                                return res.status(201).json({message: 'Новый твит создан', tweet, userId: req.user.userId})
                            })
                    });
            } else {
                createTweet(
                    req.user.userId,
                    fields,
                    null,
                    (err, tweet) => {
                        if (err) {return res.status(500)}
                        return res.status(201).json({message: 'Новый твит создан', tweet, userId: req.user.userId})
                    })
            }
        });

    } catch (e) {
        res.status(500)
            .json({message: 'Что-то пошло не так, попробуйте снова'})
    }
})

// update by id
const updateTweet = async (tweetId, fields, result, callback) => {
    const image = result?.secure_url ?? '';
    const {text} = fields;

    await Tweet.updateOne({_id: tweetId}, {$set: {
        ...(text && {text}),
        ...(image && {image}),
    }})

    return callback(null);
}

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const tweetId = req.params.id;
        const tweet = await Tweet.findById(tweetId)
        if (!tweet) {
            return res.status(404).json({message: 'Твит не найден'})
        }
        if (String(tweet.user) !== String(req.user.userId)) {
            return res.status(403).json({message: 'Нет доступа'})
        }

        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            if (err) {return res.status(500)}

            if (files?.file?.filepath) {
                cloudinary.v2.uploader.upload(
                    files.file.filepath,
                    { public_id: files.file.newFilename },
                    async (error, result) => {
                        if (error) {return res.status(500)}
                        updateTweet(
                            tweetId,
                            fields,
                            result,
                            (err) => {
                                if (err) {return res.status(500)}
                                res.status(201).json({message: 'Ваш твит изменен'})
                            })
                    });
            } else {
                updateTweet(
                    tweetId,
                    fields,
                    null,
                    (err) => {
                        if (err) {return res.status(500)}
                        res.status(201).json({message: 'Ваш твит изменен'})
                    })
            }
        });
    } catch (e) {
        res.status(500)
            .json({message: 'Что-то пошло не так, попробуйте снова'})
    }
})

// delete by id
router.delete('/:id', authMiddleware, async (req, res) => {
        try {
            const tweetId = req.params.id
            const tweet = await Tweet.findById(tweetId)

            if (!tweet) {
                return res.status(404).json({message: 'Твит не найден'})
            }

            if (String(tweet.user) !== String(req.user.userId)) {
                return res.status(403).json({message: 'Нет доступа'})
            }

            await Tweet.deleteOne({_id: tweetId});
            res.json({message: 'Ваш твит удалён'})

        } catch
            (e) {
            res.status(500)
                .json({message: 'Что-то пошло не так, попробуйте снова'})
        }
    }
)

// add remove like
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
        if (!user) {
            return res.status(400).json({
                message: 'Пожалуйста сначала выполните вход'
            })
        }

        const id = req.params.id;
        const tweet = await Tweet.findById(id)

        if (!tweet) {
            return res.status(404).json({
                message: 'Твит не найден'
            })
        }

        if (tweet.likes.includes(user._id) || user.likedTweets.includes(tweet._id)) {
            return res.status(200).json({message: 'Лайк уже добавлен'})
        }

        await User.updateOne({_id: user._id}, {$push: {likedTweets: tweet._id}})
        await Tweet.updateOne({_id: tweet._id}, {$push: {likes: user._id}})

        res.status(201).json({message: 'Лайк добавлен'})

    } catch (e) {
        res.status(500)
            .json({message: 'Что-то пошло не так, попробуйте снова'})
    }
})

router.delete('/:id/like', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
        if (!user) {
            return res.status(400).json({
                message: 'Пожалуйста сначала выполните вход'
            })
        }

        const tweetId = req.params.id;
        const tweet = await Tweet.findById(tweetId)

        if (!tweet) {
            return res.status(404).json({
                message: 'Твит не найден'
            })
        }

        if (!tweet.likes.includes(user._id) && !user.likedTweets.includes(tweet._id)) {
            return res.status(200).json({message: 'Лайк уже удален'})
        }

        const likedTweets = user.likedTweets.filter(i => String(i) !== String(tweet._id))
        await User.updateOne({_id: user._id}, {$set: {likedTweets}})

        const likes = tweet.likes.filter(i => String(i) !== String(user._id))
        await Tweet.updateOne({_id: tweet._id}, {$set: {likes}})

        res.status(200).json({message: 'Лайк удален'})


    } catch (e) {
        res.status(500)
            .json({message: 'Что-то пошло не так, попробуйте снова'})
    }
})

module.exports = router
