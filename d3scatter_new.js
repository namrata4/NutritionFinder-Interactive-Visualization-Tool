//Set the width, height and margin of the graph
var margin = {top: 20, right: 20, bottom: 30, left: 50};
var w = 1200 - margin.left - margin.right;
var h = 550 - margin.top - margin.bottom;

//Variable to hold full data
var dataset; 
//to store x axis dimension at a particular time
var xattr="chol";
//to store y axis dimension at a particular time
var yattr="energy";
//set when data is filtered by food groups
var isFiltered=false;
//set when data is brushed to specific range
var isBrushed=false;
//the brushed domain
var brushedDomain=[];
//food group by which data is currently filtered
var filteredGrp;

//All the dimensions
var attributes=["water","energy","protein","carb","fiber","sugar","sodium","satfat","chol"];
//Ranges for all dimensions
var ranges=[[0,100],[0,650],[0,90],[0,100],[0,80],[0,100],[0,30000],[0,37],[0,450]];
//All the food groups
var foodgrp=["Baked Products", "Beverages","Fast Foods", "Restaurant Foods", "Snacks", "Sweets"];

var colorPicker=["#ff0000", "#3333ff", "#ffff00", "#00ff55", "#cc4400","#ffb3ff" ];
//Load the data from csv
d3.csv("FoodData.csv", function(error, foods) {
	if (error) return console.warn(error);
	foods.forEach(function(d) {
		d.water=+d.water;
		d.energy=+d.energy;
		d.protein=+d.protein;
		d.carb=+d.carb;
		d.fiber=+d.fiber;
		d.sugar=+d.sugar;
		d.satfat=+d.satfat;
		d.chol=+d.chol;

	});
	dataset=foods;
	//draw the visualization
	drawVis(dataset,xattr,yattr);
});

//append svg to graph
var svg = d3.select("#graph").append("svg")
.attr("width", w + margin.left + margin.right)
.attr("height", h + margin.top + margin.bottom)
.style("margin-left", "20")
.append("g")
.attr("transform", "translate(" + 5 + "," + margin.top + ")");

//defining axes scale

var x = d3.scale.linear()
.domain([0, 450])
.range([0, w]);

var y = d3.scale.linear()
.domain([0, 650])
.range([h, 0]);

//not working??
/*var color=d3.scale.ordinal()
.range(["#ff0066", "#ff7f0e", "#ffff00", "#00cc44", "#000099", "#ff0000"])
.domain(foodgrp);*/

var color= function(value){
	for (i = 0; i < foodgrp.length; i++){

		if (value == foodgrp[i]){
			return colorPicker[i];
		}
	}
}


//Draw the scatterplot by data joining

function drawVis(data,xattr,yattr) {
	var circles = svg.selectAll("circle")
	.data(data);
	var circlesEnter= circles.enter()
	.append("circle")
	.attr("cx", function(d) { return x(d[xattr]);  })
	.attr("cy", function(d) { return y(d[yattr]);  })
	.attr("r", 4)
	.style("stroke", "black")
//	.style("fill", function(d) { return colLightness(d.vol); })
	.style("fill", function(d) { return color(d.foodgrp); })
	.style("opacity", 1)
	.on("click", handleClick)
	.on("mouseout", handleMouseOut);

	circles.exit().remove();


}

//Append the axes to the graph
var xAxis = d3.svg.axis()
.ticks(10)
.scale(x);

svg.append("g")
.attr("class", "xaxis")
.attr("transform", "translate(0," + h + ")")
.call(xAxis)
.append("text")
.attr("x", w + margin.left + margin.right-5)
.attr("y", -6)
.attr("id","xLabel")
.style("text-anchor", "end")
.text("Cholesterol (mg)");

var yAxis = d3.svg.axis()
.scale(y)
.orient("left")
.ticks(10);

svg.append("g")
.attr("class", "yaxis")
.call(yAxis)
.append("text")
.attr("id","yLabel")
.attr("transform", "rotate(-90)")
.attr("y", 6)
.attr("dy", ".71em")
.style("text-anchor", "end")
.text("Energy(KCal)");

//initiating brush

var brush = d3.svg.brush()
.x(x)
.on("brush", brushmove)
.on("brushend", brushend);

//appending brush
svg.append("g")
.attr("class", "brush")
.call(brush)
.selectAll('rect')
.attr('height', h);



//Handle the click event to display details of data
function handleClick(d, i) {  

	var labelDiv= document.getElementById("labelDiv");
	labelDiv.style.visibility="hidden";

	d3.select(this)
	.attr("r", 9 );

	var innerhtml= "<div class='panel-heading'><b>Food: "+d.name+"</b>  Composition (per 100g):</div><div class= 'panel-body'><table class='table table-striped'><tr><td>Water (grams): " +d.water+ 
	" </td><td> Energy (KCal): " +d.energy+ " </td></tr><tr><td> Protein (grams): " +d.protein + " </td> <td> Carbohydrates(grams): " +d.carb+ " </td></tr><tr><td> Fiber(grams): "+d.fiber +" </td><td> Sugar(grams):" +d.sugar
	+ " </td></tr><tr><td> Sodium (mg): " +d.sodium + " </td><td> Saturated Fats(grams): " +d.satfat + " </td><tr> <td>Cholesterol (mg):" + d.chol + "<td></tr></table></div></div>";

	labelDiv.innerHTML= innerhtml;
	labelDiv.style.visibility="visible";

}

//Deletes the data labels on mouse out
function handleMouseOut(d, i) {

	d3.select(this)
	.attr("r", 4 );
	var labelDiv= document.getElementById("labelDiv");
	labelDiv.style.visibility="hidden";
}

//Change x axis domain on brushing
function brushData(attr, values)
{
	var dataforfilter=dataset;
	//check if data is filtered by group
	if(isFiltered){
		//filter data to keep the group filter before brushing
		dataforfilter=dataset.filter(function(d) {return d.foodgrp == filteredGrp});
	}

	x.domain([values[0],values[1]]);
	svg.select(".xaxis")
	.transition().duration(500)
	.call(xAxis);


	svg.selectAll("circle")
	.data(dataforfilter)
	.transition()
	.duration(500)
	.attr("cx", function(d) { return x(d[attr]);  });

	isBrushed=true;
	brushedDomain=values;


}

//Filter the data by a specific food group
function filterFoodGroup(grp)
{
	toVisualize = dataset.filter(function(d) {return d.foodgrp == grp});
	var selectX= document.getElementById("xattr");
	xattr= selectX.options[selectX.selectedIndex].value;
	//yattr
	var selectY= document.getElementById("yattr");
	yattr= selectY.options[selectY.selectedIndex].value;

	drawVis(toVisualize,xattr,yattr);

	//Ceck whether data is currently brushed
	if(isBrushed)
	{
		//keep the brushed domain after filter as well
		x.domain([brushedDomain[0],brushedDomain[1]]);
	}

	//Added transition to display data filtering and x-axis domain change
	svg.select(".xaxis")
	.transition().duration(250)
	.call(xAxis);

	svg.select(".yaxis")
	.transition().duration(250)
	.call(yAxis);

	svg.selectAll("circle")
	.data(toVisualize)
	.transition()
	.duration(500)
	.attr("cx", function(d) { return x(d[xattr]);  })
	.attr("cy", function(d) { return y(d[yattr]);  })
	.attr("r", 4)
	.style("stroke", "black")
	.style("fill", function(d) { return color(d.foodgrp); })
	.style("opacity", 1);

	isFiltered=true;
	filteredGrp=grp;
	var defilterButton= document.getElementById("defilter");
	defilterButton.disabled=false;
}

//Remove the filter from data
function defilter(){
	var selectX= document.getElementById("xattr");
	xattr= selectX.options[selectX.selectedIndex].value;
	//yattr
	var selectY= document.getElementById("yattr");
	yattr= selectY.options[selectY.selectedIndex].value;
	drawVis(dataset,xattr,yattr);

	if(isBrushed)
	{//if data is brushed then keep the brush after removing filter
		x.domain([brushedDomain[0],brushedDomain[1]]);
	}

	svg.select(".xaxis")
	.transition().duration(250)
	.call(xAxis);

	svg.select(".yaxis")
	.transition().duration(250)
	.call(yAxis);

	//added transition to data for smooth change
	svg.selectAll("circle")
	.data(dataset)
	.transition()
	.duration(500)
	.attr("cx", function(d) { return x(d[xattr]);  })
	.attr("cy", function(d) { return y(d[yattr]);  })
	.attr("r", 4)
	.style("stroke", "black")
	.style("fill", function(d) { return color(d.foodgrp); })
	.style("opacity", 1);

	isFiltered=false;
	var defilterButton= document.getElementById("defilter");
	defilterButton.disabled=true;


}

//Redraw the graph when axes dimentions are changed using dropdown
function reDraw()
{

//	clear brush
	var get_button = d3.select(".clear-button");
	if(get_button.empty()==false)
	{
		get_button.remove();
	}
//	xattr
	var selectX= document.getElementById("xattr");
	xattr= selectX.options[selectX.selectedIndex].value;
//	yattr
	var selectY= document.getElementById("yattr");
	yattr= selectY.options[selectY.selectedIndex].value;



	for (i = 0; i < attributes.length; i++){

		if (xattr == attributes[i]){
			x.domain([ranges[i][0],ranges[i][1]]);
		}
		if (yattr == attributes[i]){
			y.domain([ranges[i][0],ranges[i][1]]);
		}

	}
	drawVis(dataset,xattr,yattr);
	svg.select(".xaxis")
	.transition().duration(250)
	.call(xAxis);

	var xlabel= document.getElementById("xLabel");
	xlabel.textContent=selectX.options[selectX.selectedIndex].text;

	svg.select(".yaxis")
	.transition().duration(250)
	.call(yAxis);
	var ylabel= document.getElementById("yLabel");
	ylabel.textContent=selectY.options[selectY.selectedIndex].text;

	svg.selectAll("circle")
	.data(dataset)
	.transition()
	.duration(500)
	.attr("cx", function(d) { return x(d[xattr]);  })
	.attr("cy", function(d) { return y(d[yattr]);  })
	.attr("r", 4)
	.style("stroke", "black")
	.style("fill", function(d) { return color(d.foodgrp); })
	.style("opacity", 1);



}

//brush functions
function brushmove() {
	var extent = brush.extent();
	var circles= svg.selectAll("circle");
	circles.classed("selected", function(d) {
		is_brushed = extent[0] <= d[xattr] && d[xattr] <= extent[1];
		return is_brushed;
	});


}

function brushend() {

	get_button = d3.select(".clear-button");
	var extent = brush.extent();
	if(extent[0]!=extent[1])
	{

		var attrRange;
		for (i = 0; i < attributes.length; i++){
			if (xattr == attributes[i]){
				attrRange=[ranges[i][0],ranges[i][1]];
			}}	  
		if(get_button.empty() === true) {
			clear_button = svg.append('text')
			.attr("y", 10)
			.attr("x", 1100)
			.attr("class", "clear-button")
			.text("Clear Brush");


			clear_button.on('click', function(){

				brushData(xattr,attrRange);
				clear_button.remove();
			});

		}
		brushData(xattr, extent);
		var circles= svg.selectAll("circle");
		circles.classed("selected", false);
		d3.select(".brush").call(brush.clear());

	}
}


