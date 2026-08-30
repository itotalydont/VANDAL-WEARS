// Shared VANDAL product catalog + helpers.
// Loaded by shop.html and product.html so both pages stay in sync.

const PRODUCTS = [

{
name:"VANDAL JERSEY",
price:25000,
colors:[
"VANDAL JERSEY RED.png",
"VANDAL JERSEY BLUE.png",
"VANDAL JERSEY LIGHT BLUE.png",
"VANDAL JERSEY PINK.png",
"VANDAL JERSEY GREEN.png",
"VANDAL JERSEY GRAY.png",
"VANDAL JERSEY BLACK.png"
]
},

{
name:"VANDAL TEE",
price:20000,
colors:[
"VANDAL TEE BLACK.png",
"VANDAL TEE GRAY.png",
"VANDAL TEE GREEN.png",
"VANDAL TEE WHITE.png",
"VANDAL TEE LIME GREEN.png"
]
},

{
name:"DOUBLE WAIST",
price:35000,
colors:[
"DOUBLE WAIST RED.png",
"DOUBLE WAIST BLUE.png",
"DOUBLE WAIST GRAY.png",
"DOUBLE WAIST PINK.png",
"DOUBLE WAIST WHITE.png",
"DOUBLE WAIST BLACK.png"
]
},

{
name:"FEM POLO",
price:23000,
colors:[
"FEM POLO RED.png",
"FEM POLO BLUE.png",
"FEM POLO GRAY.png",
"FEM POLO PINK.png",
"FEM POLO WHITE.png",
"FEM POLO BLACK.png",
"FEM POLO LIGHT GRAY.png"
]
},

{
name:"KOM TEE",
price:20000,
colors:[
"KOM TEE RED.png",
"KOM TEE BLUE.png",
"KOM TEE GRAY.png",
"KOM TEE PINK.png",
"KOM TEE WHITE.png"
]
},

{
name:"VANDAL shorts V1",
price:25000,
colors:[
"VANDAL SHORTS V1 RED.png",
"VANDAL SHORTS V1 BLUE.png",
"VANDAL SHORTS V1 PINK.png",
"VANDAL SHORTS V1 GRAY.png",
"VANDAL SHORTS V1 GREEN.png",
"VANDAL SHORTS V1 WHITE.png"
]
},

{
name:"VANDAL shorts V2",
price:25000,
colors:[
"VANDAL SHORTS V2 RED.png",
"VANDAL SHORTS V2 BLUE.png",
"VANDAL SHORTS V2 PINK.png",
"VANDAL SHORTS V2 GRAY.png",
"VANDAL SHORTS V2 GREEN.png",
"VANDAL SHORTS V2 BLACK.png"
]
},

{
name:"MISCHIEF SWEATS",
price:30000,
colors:[
"MISCHIEF SWEATS RED.png",
"MISCHIEF SWEATS BLUE.png",
"MISCHIEF SWEATS GRAY.png",
"MISCHIEF SWEATS PINK.png",
"MISCHIEF SWEATS WHITE.png",
"MISCHIEF SWEATS BLACK.png"
]
},

{
name:"FEM SHORTS",
price:15000,
colors:[
"FEM SHORTS RED.png",
"FEM SHORTS BLUE.png",
"FEM SHORTS GRAY.png",
"FEM SHORTS PINK.png",
"FEM SHORTS BLACK.png"
]
},

{
name:"QUEEN BABY TEE",
price:19000,
colors:[
"QOM BABY TEE RED.png",
"QOM BABY TEE BLUE.png",
"QOM BABY TEE GRAY.png",
"QOM BABY TEE PINK.png",
"QOM BABY TEE WHITE.png"
]
},

{
name:"FEM FOLDOVER SWEATS",
price:28000,
colors:[
"FEM FOLDOVER SWEATS RED.png",
"FEM FOLDOVER SWEATS BLACK.png",
"FEM FOLDOVER SWEATS GRAY.png",
"FEM FOLDOVER SWEATS BLUE.png",
"FEM FOLDOVER SWEATS WHITE.png",
"FEM FOLDOVER SWEATS PINK.png"
]
},

{
name:"BEANIE",
price:11000,
sizes:["S","M","L"],
colors:[
"beanie-red.png",
"beanie-blue.png",
"beanie-gray.png",
"beanie-pink.png",
"beanie-black.png",
"beanie-white.png"
]
}

];

function formatPrice(amount){
return "₦" + amount.toLocaleString("en-NG");
}

function guessColor(file){

let lower = file.toLowerCase();

if(lower.includes("red")) return "red";
if(lower.includes("blue")) return "blue";
if(lower.includes("gray")) return "gray";
if(lower.includes("pink")) return "pink";
if(lower.includes("white")) return "white";
if(lower.includes("green")) return "green";
if(lower.includes("lime")) return "lime";
if(lower.includes("black")) return "black";

return "white";

}

// Shorts, sweats, double waist, and foldover pieces get a height guide
// so people can pick the right length/fit.
function needsHeight(name){
return /shorts|sweats|waist|foldover/i.test(name);
}

const HEIGHT_OPTIONS = [
"4'10\" - 5'2\"",
"5'3\" - 5'6\"",
"5'7\" - 5'10\"",
"5'11\" - 6'2\"",
"6'3\" and up"
];

// Default size options for most products. Override per-product with a
// "sizes" array (see BEANIE below) when a product needs a different set.
const DEFAULT_SIZES = ["ES", "S", "M", "L", "XL", "XXL"];

function getSizes(product){
return product.sizes || DEFAULT_SIZES;
}