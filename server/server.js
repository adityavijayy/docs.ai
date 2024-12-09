const mongoose = require("mongoose")
const Document = require("./Document")
require('dotenv').config()

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// MongoDB Connection Error Handling
const db = mongoose.connection
db.on('error', (error) => {
  console.error('MongoDB connection error:', error)
})
db.once('open', () => {
  console.log('Connected to MongoDB successfully!')
})

// Socket.io setup
const io = require("socket.io")(process.env.PORT || 3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

const defaultValue = ""

io.on("connection", socket => {
  console.log('New client connected')
  
  socket.on("get-document", async documentId => {
    try {
      const document = await findOrCreateDocument(documentId)
      socket.join(documentId)
      socket.emit("load-document", document.data)

      socket.on("send-changes", delta => {
        socket.broadcast.to(documentId).emit("receive-changes", delta)
      })

      socket.on("save-document", async data => {
        try {
          await Document.findByIdAndUpdate(documentId, { data })
          console.log('Document saved successfully')
        } catch (error) {
          console.error('Error saving document:', error)
        }
      })
    } catch (error) {
      console.error('Error loading document:', error)
      socket.emit("error", "Failed to load document")
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected')
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return

  try {
    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({ _id: id, data: defaultValue })
  } catch (error) {
    console.error('Error in findOrCreateDocument:', error)
    throw error
  }
}
