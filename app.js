const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function init() {
    try {
        await mongoose.connect("mongodb+srv://cenzo_gi:HxTypny8ifMh0IZn@cluster0.jczqx8f.mongodb.net/todolistDB", { useNewUrlParser: true });
        console.log("Connected to MongoDB");

        const itemsSchema = {
            name: String
        };

        const Item = mongoose.model("Item", itemsSchema);

        const item1 = new Item({
            name: "Welcome to your To-do List"
        });

        const item2 = new Item({
            name: "Hit the + button to add a new item."
        });

        const item3 = new Item({
            name: "<-- Hit this to delete an item."
        });

        const defaultItems = [item1, item2, item3];

        const listSchema = {
          name: String,
          items: [itemsSchema]
        };

        const List = mongoose.model("List", listSchema);

        app.get("/", async function (req, res) {
            try {
                const foundItems = await Item.find({}).exec();
                if (foundItems.length === 0) {
                    await Item.insertMany(defaultItems, {
                        timeout: 60000
                    });
                    console.log("Inserted Documents");
                }
                res.render("list", { listTitle: "Today", newListItems: foundItems });
            } catch (err) {
                console.log(err);
            }
        });

        app.get("/:customListName", async function (req, res){
        try {
          const customListName = _.capitalize(req.params.customListName);

          const foundList = await List.findOne({name: customListName}).exec();

            if (!foundList){
              // Create a new list
              const list = new List ({
                name: customListName,
                items: defaultItems
              });

              list.save();
              res.redirect("/" + customListName);
            } else {
            res.render("list", { listTitle: foundList.name, newListItems: foundList.items } )
          }





        } catch (err) {
          console.log(err);
        }
        });

        app.post("/", async function (req, res) {
    try {
      const itemName = req.body.newItem;
      const listName = req.body.list;

      const item = new Item({
        name: itemName
      });

      if (listName === "Today") {
        await item.save();
        res.redirect("/");
      } else {
        const foundList = await List.findOne({ name: listName }).exec();
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      }
    } catch (err) {
      console.log(err);
      res.status(500).send("An error occurred while processing the request.");
    }
  });

        app.post("/delete", async function (req, res) {
            try {
                const checkedItemId = req.body.checkbox;
                const listName = req.body.listName;
                const removedDocument = await Item.findByIdAndRemove(checkedItemId);

              if(listName === "Today") {
                res.redirect("/");
                 console.log("Document successfully removed!");
              } else {
                await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
                res.redirect("/" + listName);

              }
            }
            catch (err) {
                console.log(err);
            }
        });


    } catch (err) {
        console.log(err);
    }


}

init();








// ABOUT

app.get("/about", function(req, res){
res.render("about");
});

// LISTEN PORT

app.listen(3000, function() {
console.log("Server started on port 3000");
});
