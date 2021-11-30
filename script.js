//constants
const URL = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';
const FILL_COLORS = {
        //colors taken from the free code camp heat map from lightest to darkest
        colors:['#313695','#74add1','#e0f3f8', '#fee090', '#fee090', '#f46d43', '#a50026','#ff0000','#c70000']
    };

//CONSTANTS to control the heatMap, acts as a form of options as well
const CONSTANTS = {
    URL:URL,
    SVG_WRAPPER_ID:'#graphWrapper',
    HEIGHT:400,
    WIDTH:900,
    LEFT_PADDING:60, //the ammount of padding from the left of the graph
    TOP_PADDING:60, //Amount of padding from the top of the graph
    RIGHT_PADDING:30, //The amount of padding from the right of the graph
    BOTTOM_PADDING:50   , //The amount of padding from the bottom of the graph
    X_DATA_PADDING:2,    //Padding for the x axis data
    FILL_COLORS:FILL_COLORS
};

//The heatMap class
class HeatMap{
    constructor(data){
        
        //instantiate class variables
        this._instantVar(data);

        //build the toolTip
        this._buildToolTip();

        //build the graph
        this._buildGraph(this.monthArray);

        //Color Legend
        this._buildLegend();
    }
    
    //instantitate variables
    _instantVar(data){
        this.monthArray = []; //Holds temperature data for each month
        this.baseTemperature = data.baseTemperature; //Holds the base Temperature
    
        for(let i = 0; i < data.monthlyVariance.length;i++){
            this.monthArray.push(data.monthlyVariance[i]);
        }
    }
    
    //builds a toolTip, places a div on the body
    _buildToolTip(){
        d3.select('body')
        .append('div')
        .attr('id','tooltip')
        .style('opacity',0);
    }
    
    //Builds the graph
    _buildGraph(data){
        //build the svg element
        d3.select('#graphWrapper')
            .append('svg')
            .attr('width',CONSTANTS.WIDTH)
            .attr('height',CONSTANTS.HEIGHT);

        //build the scales
        let scales = this._buildScales(data);

        //build the axis
        this._buildAxis(data,scales.xScaleAxis,scales.yScaleAxis);
        
        //build the points on the graph
        this._buildRects(data,scales.xScaleData,scales.yScaleData);
    }
    
    //Builds the scales for use
    _buildScales(dataSet){
        let xDomain = [];

        for(let i = 0; i < dataSet.length;i++){
            xDomain.push(dataSet[i].year);
        }

        //data x scale
        let xScaleData = d3.scaleBand();
        xScaleData.domain(xDomain);
        xScaleData.range([CONSTANTS.LEFT_PADDING,CONSTANTS.WIDTH - CONSTANTS.RIGHT_PADDING]);

        //axis x scale
        let xScaleAxis = xScaleData;
        //data y scale

        let yScaleData = d3.scaleBand();
        yScaleData.domain([0,1,2,3,4,5,6,7,8,9,10,11]);
        yScaleData.range([CONSTANTS.BOTTOM_PADDING,CONSTANTS.HEIGHT - CONSTANTS.TOP_PADDING]);

        //axis y scale
        let yScaleAxis = yScaleData;

        return {
            xScaleData:xScaleData,
            yScaleData:yScaleData,
            xScaleAxis:xScaleAxis,
            yScaleAxis:yScaleAxis,
        };
    }
    
    //Builds and places the AXIS
    _buildAxis(dataSet,xScaleAxis,yScaleAxis){
        let svg= d3.select('svg');
        let formatString = '%B';
        let domain = xScaleAxis.domain();
        let xAxis = d3.axisBottom(xScaleAxis);
        let yAxis = d3.axisLeft(yScaleAxis);
        xAxis.tickValues(domain.filter((v,i)=>!(v%10)));
        yAxis.tickFormat( (val) => d3.timeFormat("%B")(new Date(1970, val, 1))) 
        xAxis.tickSizeOuter(0);
        yAxis.tickSizeOuter(0);


        svg.append('g')
            .attr('id','x-axis')
            .attr('transform','translate('+CONSTANTS.X_DATA_PADDING+','+ (CONSTANTS.HEIGHT - CONSTANTS.TOP_PADDING) +')')
            .call(xAxis);

        svg.append('g')
            .attr('id','y-axis')
            .attr('transform','translate('+CONSTANTS.LEFT_PADDING +','+ 0 +')')
            .call(yAxis)
    }
    
    //Builds and places the rectangles
    _buildRects(dataSet,xScaleData,yScaleData){
        let svg= d3.select('svg');
        let doper = CONSTANTS.DOPER;
        let clean = CONSTANTS.CLEAN;

        //find lowest variance
        let lowestV = dataSet[0].variance;
        let highestV = dataSet[0].variance;

        for(let i = 1; i < dataSet.length; i++){
            if(lowestV > dataSet[i].variance){
                lowestV = dataSet[i].variance;
            }
            if(highestV < dataSet[i].variance){
                highestV = dataSet[i].variance;
            }
        }
        
        svg.selectAll('rect')
            .data(dataSet)
            .enter()
            .append('rect')
            .attr('class','cell')
            .attr('x',d=>(xScaleData(d.year)) + CONSTANTS.X_DATA_PADDING)
            .attr('y',d=>(yScaleData(d.month-1)))
            .attr('height',d=>yScaleData.bandwidth())
            .attr('width',d=>xScaleData.bandwidth())
            .attr('data-month',d=>d.month - 1)
            .attr('data-year',d=>d.year)
            .attr('data-temp',d=>this.baseTemperature + d.variance)
            .style('fill',(d)=>{
                return CONSTANTS.FILL_COLORS.colors[this._getTempIndex(d.variance,lowestV,highestV)];
            })
            .on('mouseover',addToolTip)
            .on('mouseout',removeToolTip)
        
        //needed for the tool tip function to work correctly
        let baseTemperature = this.baseTemperature;
        
        //adds the tool tip
        function addToolTip(d,index){
            let toolTip = d3.select('#tooltip');
            let xPos = d3.event.clientX;
            let yPos = d3.event.clientY;
            let leftPadding = 20;

            let month = ['Janurary','February','March','April','May','June','July','August','September','October','November','December'];

            let rect = d3.selectAll('rect').filter((d,i)=>i == index);
            rect.style('stroke','black');
            rect.style('stroke-width','1');

            toolTip.style('opacity',0.75);
            toolTip.attr('data-year',d.year)
            toolTip.html(d.year +':' + month[d.month - 1] + '<br>Temperature:' + (baseTemperature + d  .variance).toFixed(2));
            toolTip.style('left',d3.touches);
            toolTip.style('left',xPos + leftPadding + 'px');
            toolTip.style('top',yPos + 'px');
            toolTip.attr('data-date',d[0]);
        }
        
        //removes the tool tip
        function removeToolTip(d,index){
            let toolTip = d3.select('#tooltip');
            let rect = d3.selectAll('rect').filter((d,i)=>i == index);
            rect.style('stroke-width','0');
            toolTip.style('opacity',0);
        }
    }
    
    //Gets the Index to represent the available colors
    _getTempIndex(variance,lowestVariance,highestVariance){
        //variables
        let tempRange = (highestVariance - lowestVariance) / CONSTANTS.FILL_COLORS.colors.length; //length of a single box
        let startTemp = this.baseTemperature+lowestVariance;                                       //Temp to start counting up from
        let index = 0;                                                                            //Index of the color box based on the variance
        let realTemp = this.baseTemperature + variance;
        let indexFound = false; //Indicates an index was found

        while(!indexFound){
            if((realTemp >= startTemp + tempRange * index) && realTemp <= startTemp + tempRange * (index + 1)){
                indexFound = true;
            }else{
                index++;
            }
        }
        return index;
    }
    
    //Builds the legend for the chart
    _buildLegend(){
        let svg = d3.select('svg');
        let legend = svg.append('g');

        legend.attr('id','legend');
        legend.attr('transform','translate(600,12)')
        legend.append('text').text('Temperature Key').attr('x',35);

        for(let i = 0; i < CONSTANTS.FILL_COLORS.colors.length;i++){
            legend.append('rect').attr('width',20).attr('height',20).attr('x',i * 20 + 5).attr('y',5).attr('fill',CONSTANTS.FILL_COLORS.colors[i]);
        }
    }

}

function main (data){
    let heatMap = new HeatMap(data);
};

(function makeHttpRequest(){
    let url = CONSTANTS.URL;
    let data = '';
    let xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function (){
        if(this.readyState == 4 && this.status == 200){
            data = xhttp.responseText;
            main(JSON.parse(data));
        }
    }

    xhttp.open('GET',url,true);
    xhttp.send();
}());