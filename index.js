require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.54bcg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const tasksCollection = client.db("Task-management").collection("task");
const usersCollection = client.db("Task-management").collection("user");




app.post('/tasks', async (req, res) => {
    try {
        const task = req.body;

        // Set the order field to the next available order
        // For simplicity, we'll set it to 0 if no order is provided.
        task.order = task.order || 0;  // You can replace this with logic to dynamically set order

        // Add a valid timestamp to the task
        task.timestamp = new Date().toISOString(); // ISO string format for date

        const result = await tasksCollection.insertOne(task);

        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error adding task", error });
    }
});


app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, category, order } = req.body; // Ensure 'order' is passed in the request body

    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: {
            ...(title && { title }),
            ...(description && { description }),
            ...(category && { category }),
            ...(order !== undefined && { order }) // Only update order if it's provided
        },
    };

    try {
        const result = await tasksCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.json({ message: "Task updated successfully", id });
    } catch (error) {
        res.status(500).json({ message: "Error updating task", error });
    }
});

// API: Delete a Task
app.delete('/tasks/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };

        const result = await tasksCollection.deleteOne(filter);

        if (result.deletedCount === 0) {
            return res.status(404).send({ message: "Task not found" });
        }

        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error deleting task", error });
    }
});

// API: Store User Info (On First Login)
app.put('/users', async (req, res) => {
    try {
        const user = req.body;
        const filter = { uid: user.uid };
        const options = { upsert: true };
        const updateDoc = { $set: user };

        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error storing user data", error });
    }
});

// API: Get User Tasks
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await tasksCollection.find().sort({ order: 1 }).toArray();  // Sorting by the 'order' field
        res.send(tasks);
    } catch (error) {
        res.status(500).send({ message: "Error retrieving tasks", error });
    }
});


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Task Management Server is running');
});

app.listen(port, async () => {
    console.log(`Server listening on port ${port}`);
});
