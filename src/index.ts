import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { ContentModel, LinkModel } from './db';
import { userMiddleware } from './middleware';
import { JWT_PASSWORD } from "./config";
import { UserModel } from "./db";
import { random } from "./utils";
import cors from 'cors';
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors())

mongoose.connect("mongodb+srv://yashshinde121work:yash1234@cluster0.rjpnx.mongodb.net/SecondBrain")


app.post("/api/v1/signup",async(req, res) => {
        const { username, password }  =  req.body;
        if (!password || !username) {
           res.status(411).json({ message: "Error in inputs. Username and password are required."})
        }
        try {
            await UserModel.create({
            username: username,
            password: password
        })
        res.status(200).json({
            message: "User Signed Up"
        })
        } catch (e) {
            res.status(403).json({
            message: "User already exists"
        })   
        }
        
});
app.post("/api/v1/signin", async(req, res) => {
    const { username, password }  =  req.body;

    const existingUser = await UserModel.findOne({
        username,
        password
    })

    if (existingUser){
        const token  = jwt.sign({
            id : existingUser._id
        },JWT_PASSWORD) 
         res.json({
        token
       })
    }else{
        res.status(403).json({
            message: "Wrong credentials"
        })
    }

});

app.post("/api/v1/content",userMiddleware,async (req, res) => {
    
    const link = req.body.link;
    const type = req.body.type;
    await ContentModel.create({
        link,
        type,
        title: req.body.title,
        userId: req.userId,
        tags: []
    })
    res.json({
        message:"Contents are added successfully"
    })

})
app.get("/api/v1/content",userMiddleware,async (req, res) => {
    //@ts-ignore
    const userId = req.userId
    const content = await ContentModel.find({
        userId: userId
    }).populate("userId","username")
    res.json({
        content
    })

})
app.delete("/api/v1/content", userMiddleware,async (req, res) => {
    
    const contentId = req.body.contentId
    await ContentModel.deleteMany({
        contentId,
        userId: req.userId
    })
    res.json({
        message: "Content deleted successfully"
    })

})
app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    const share = req.body.share;
    if (share) {
            const existingLink = await LinkModel.findOne({
                userId: req.userId
            });

            if (existingLink) {
                res.json({
                    hash: existingLink.hash
                })
                return;
            }
            const hash = random(10);
            await LinkModel.create({
                userId: req.userId,
                hash: hash
            })

            res.json({
                hash
            })
    } else {
        await LinkModel.deleteOne({
            userId: req.userId
        });

        res.json({
            message: "Removed link"
        })
    }
})

app.get("/api/v1/brain/:shareLink", async (req, res) => {
    const hash = req.params.shareLink;

    const link = await LinkModel.findOne({
        hash
    });

    if (!link) {
        res.status(411).json({
            message: "Sorry incorrect input"
        })
        return;
    }
    // userId
    const content = await ContentModel.find({
        userId: link.userId
    })

    console.log(link);
    const user = await UserModel.findOne({
        _id: link.userId
    })

    if (!user) {
        res.status(411).json({
            message: "user not found, error should ideally not happen"
        })
        return;
    }

    res.json({
        username: user.username,
        content: content
    })

})

app.listen(PORT, () => {console.log(`server is running at ${PORT}`)})



