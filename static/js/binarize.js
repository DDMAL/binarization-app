//Default threshold before user input
var defThresh = 127;
//Maximum value for greyness
var G = 255;
//Scale values for grayscaling RGB (taken from http://www.mathworks.com/help/toolbox/images/ref/rgb2gray.html )
var rScale = 0.2989;
var gScale = 0.5870;
var bScale = 0.1140;
var widthLim = 750;
var heightLim = 750;
var imageObj;

//Setup
window.onload = function() {
    imageObj = new Image();
    //Calculate initial threshold with the Brink formula and draw binarized image
    imageObj.onload = initImage;
    
    //Image path (TO BE REPLACED LATER)
    imageObj.src = "/static/images/ISHAM_3558.15.39_0068.jpg";
    //imageObj.src = imageScale(imageObj);
    
    //jQuery slider definition for threshold controller
    $("#slider").slider({
                        animate: true,
                        min: 0,
                        max: G,
                        orientation: "horizontal",
                        step: 1,
                        value: defThresh,
                        range: false,
                        slide: function(event, ui) {binarize(ui.value)},
                        });
};

initImage = function() {
    //Adjust size of canvas to fit image
    $("#imview").attr("width", imageObj.width);
    $("#imview").attr("height", imageObj.height);
    $("#imorig").attr("width", imageObj.width);
    $("#imorig").attr("height", imageObj.height);
    var pmf = genPMF(imageObj);
    defThresh = threshBrink(pmf);
    binarize(defThresh);
    
    //Manually set inital value for slider
    $("#slider").slider("value", defThresh);
    $("#slider").width(imageObj.width * 2);
}

//Binarizes data, splitting foreground and background at a given brightness level
binarize = function(thresh) {
    var canvasA = document.getElementById("imview");
    var contextA = canvasA.getContext("2d");
    var canvasB = document.getElementById("imorig");
    var contextB = canvasB.getContext("2d");
    $("#threshsend").attr("value", thresh);
    if (imageObj.width > widthLim || imageObj.height > heightLim) {
        var scaleValA = 0;
        var scaleValB = 0;
        scaleValA = widthLim / imageObj.width;
        scaleValB = heightLim / imageObj.height;
        var scaleVal = Math.min(scaleValA, scaleValB);
        canvasA.width = canvasA.width * scaleVal;
        canvasA.height = canvasA.height * scaleVal;
        canvasB.width = canvasB.width * scaleVal;
        canvasB.height = canvasB.height * scaleVal;
        imageObj.height *= scaleVal;
        imageObj.width *= scaleVal;
        contextA.scale(scaleVal, scaleVal);
        contextB.scale(scaleVal, scaleVal);
        
    }
    //Have to redraw image and then scrape data
    contextA.drawImage(imageObj, 0, 0);
    contextB.drawImage(imageObj, 0, 0);
    var imageData = contextA.getImageData(0, 0, canvasA.width, canvasA.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i +=4) {
        //Brightness is the greyscale value for the given pixel
        var brightness = rScale * data[i] + gScale * data[i + 1] + bScale * data[i + 2];
        
        // Binarize image (set to black or white)
        if (brightness > thresh) {
            data[i] = G;
            data[i + 1] = G;
            data[i + 2] = G;
        } else {
            //data[i] = 0;
            //data[i + 1] = 0;
            //data[i + 2] = 0;
        }
    }
    //Draw binarized image
    contextA.putImageData(imageData, 0, 0);
}

// Generates a PMF (Probability Mass Function) for the given image
genPMF = function(imageObj) {
    var canvas = document
    var canvas = document.getElementById("imview");
    var context = canvas.getContext("2d");
    
    //Have to redraw image and then scrape data
    context.drawImage(imageObj, 0, 0);
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var pmf = new Array(G + 1);
    for (var i = 0; i < pmf.length; i++)
        pmf[i] = 0;
    for (var i = 0; i < data.length; i +=4) {
        //Brightness is the greyscale value for the given pixel
        var brightness = rScale * data[i] + gScale * data[i + 1] + bScale * data[i + 2];
        pmf[Math.round(brightness)]++;
    }
    // Normalize PMF values to total 1
    for (var i = 0; i < pmf.length; i++)
        pmf[i] /= (data.length / 4);
    return pmf;
}

//Mean of foreground (darker than threshold) levels
meanForeground = function(T, pmf) {
    mF = 0;
    for (var g = 0; g <= T; g++)
        mF += (g * pmf[g]);
    return mF;
}

//Mean of background (lighter than threshold) levels
meanBackground = function(T, pmf) {
    mB = 0;
    for (var g = T + 1; g <= G; g++)
        mB += (g * pmf[g]);
    return mB;
}

//Brink thresholding function
threshBrink = function(pmf) {
    //Initial minVal to be reset in first iteration
    var minVal = -1;
    //Minimum-valued threshold encountered
    var minT = 0;
    
    //Take argmin{H(T)}
    for (var T = 0; T <= G; T++) {
        var lSum = 0;
        for (var g = 1; g <= T; g++) {
            mF = meanForeground(T, pmf);
            var llog = mF * Math.log(mF / g);
            var rlog = g * Math.log(g / mF);
            lSum += (pmf[g] * (llog + rlog));
        }
        var rSum = 0;
        for (var g = T + 1; g <= G; g++) {
            mB = meanBackground(T, pmf);
            var llog = mB * Math.log(mB / g);
            var rlog = g * Math.log(g / mB);
            rSum += (pmf[g] * (llog + rlog));
        }
        var total = lSum + rSum;
        if (total < minVal || minVal < 0) {
            minVal = total;
            minT = T;
        }
    }
    return minT;
}


readIMG = function(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        imageObj = new Image();
        imageObj.onload = initImage;
        reader.onload = function (e) {
            imageObj.src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}