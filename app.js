import express from "express";
import bodyParser from "body-parser";
const app= express();
app.use(bodyParser.urlencoded({extended:true}));
const port=3000;
app.use(express.static("public"));
app.set("view engine", "ejs");
app.get("/",(req,res)=>{
    res.render("index", {
        activePage: "home"
    });
});
app.get("/login",(req,res)=>{
    res.render("login", {
        activePage: "login"
    });
});
app.get("/about",(req,res)=>{
    res.render("about", {
        activePage: "about"
    });
});
app.get("/contact",(req,res)=>{
    res.render("contact", {
        activePage: "contact"
    });
});
app.get("/scholarships",(req,res)=>{
    res.render("scholarships", {
        activePage: "scholarships"
    });
});

app.listen(port,()=>{
    console.log(`Server is running at port ${port}`)
});