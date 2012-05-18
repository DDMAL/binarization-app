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
var globalThresh = 0;

//Setup
window.onload = function() {
    imageObj = new Image();
    //Calculate initial threshold with the Brink formula and draw binarized image
    imageObj.onload = initImage;
    
    //Image path (TO BE REPLACED LATER)
    imageObj.src = "/static/images/ISHAM_3558.15.39_0068.png";
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
    
    $("#threshsend").click(function () {
                           $.ajax({
                                  type: "POST",
                                  data: {
                                            img_url:      imageObj.src.replace("http://localhost:8888", "."),
                                            thresh_value: globalThresh
                                        },
                                  url: "/binarize/simplethreshold"
                                  });
                           });
};

initImage = function() {
    //Adjust size of canvas to fit image
    $("#imview").attr("width", imageObj.width);
    $("#imview").attr("height", imageObj.height);
    $("#imorig").attr("width", imageObj.width);
    $("#imorig").attr("height", imageObj.height);
    if (imageObj.width > widthLim || imageObj.height > heightLim) {
        var canvasA = document.getElementById("imview");
        var contextA = canvasA.getContext("2d");
        var canvasB = document.getElementById("imorig");
        var contextB = canvasB.getContext("2d");
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
        contextB.drawImage(imageObj, 0, 0);
    }
    var pmf = genPMF(imageObj);
    defThresh = threshBrinkJ(pmf);
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
    globalThresh = thresh;
    //Have to redraw image and then scrape data
    contextA.drawImage(imageObj, 0, 0);
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
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
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

threshBrinkJ = function(pmf) {
    var Topt = 0;
    var locMin;
    var isMinInit = 0;
    
    var mF = new Array(256);
    var mB = new Array(256);
    
    var tmpVec1 = new Array(256);
    var tmpVec2 = new Array(256);
    var tmpVec3 = new Array(256);
    
    var tmp1 = new Array(256);
    var tmp2 = new Array(256);
    var tmp3 = new Array(256);
    var tmp4 = new Array(256);
    
    var tmpMat1 = new Array(256);
    var tmpMat2 = new Array(256);
    
    for (var i = 0; i < 256; i++) {
        tmp1[i] = new Array(256);
        tmp2[i] = new Array(256);
        tmp3[i] = new Array(256);
        tmp4[i] = new Array(256);
        
        tmpMat1[i] = new Array(256);
        tmpMat2[i] = new Array(256);
    }
    
    mF[0] = 0.0;
    for (var i = 1; i < 256; i++)
        mF[i] = i * pmf[i] + mF[i - 1];
    mB = mF.slice(0);
    
    for (var i = 0; i < 256; i++)
        mB[i] = mF[255] - mB[i];
    
    for (var i = 0; i < 256; i++) {
        for (var j = 0; j < 256; j++) {
            tmp1[i][j] = mF[j] / i;
            if ((mF[j] == 0) || (i == 0)) {
                tmp2[i][j] = 0.0;
                tmp3[i][j] = 0.0;
            } else {
                tmp2[i][j] = Math.log(tmp1[i][j]);
                tmp3[i][j] = Math.log(1.0 / tmp1[i][j]);
            }
            tmp4[i][j] = pmf[i] * (mF[j] * tmp2[i][j] + i * tmp3[i][j]);
        }
    }
    tmpMat1[0] = tmp4[0].slice(0);

    for (var i = 1; i < 256; i++)
        for (var j = 0; j < 256; j++)
            tmpMat1[i][j] = tmpMat1[i - 1][j] + tmp4[i][j];
    for (var i = 0; i < 256; i++)
        tmpVec1[i] = tmpMat1[i][i];
    
    
    for (var i = 0; i < 256; i++) {
        for (var j = 0; j < 256; j++) {
            tmp1[i][j] = mB[j] / i;
            if ((mB[j] == 0) || (i == 0)) {
                tmp2[i][j] = 0.0;
                tmp3[i][j] = 0.0;
            } else {
                tmp2[i][j] = Math.log(tmp1[i][j]);
                tmp3[i][j] = Math.log(1.0 / tmp1[i][j]);
            }
            tmp4[i][j] = pmf[i] * (mB[j] * tmp2[i][j] + i * tmp3[i][j]);
        }
    }
    
    tmpVec2 = tmp4[0].slice(0);
    
    for (var i = 0; i < 256; i++)
        for (var j = 0; j < 256; j++)
            tmpVec2[j] += tmp4[i][j];
    
    tmpMat2[0] = tmp4[0].slice(0);
    
    for (var i = 1; i < 256; i++)
        for (var j = 0; j < 256; j++)
            tmpMat2[i][j] = tmpMat2[i - 1][j] + tmp4[i][j];
    for (var i = 0; i < 256; i++)
        tmpVec3[i] = tmpMat2[i][i];
    
    for (var i = 0; i < 256; i++)
        tmpVec2[i] -= tmpVec3[i];
    for (var i = 0; i < 256; i++)
        tmpVec1[i] += tmpVec2[i];
    
    for (var i = 0; i < 256; i++) {
        if (mF[i] != 0 && mB[i] != 0) {
            if ((isMinInit == 0) || (tmpVec1[i] < locMin)) {
                isMinInit = 1;
                locMin = tmpVec1[i];
                Topt = i;
            }
        }
    }
    
    return Topt;
}


readIMG = function(input) {
    if (window.FileReader) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            imageObj = new Image();
            imageObj.onload = initImage;
            reader.onload = function (e) {
                imageObj.src = e.target.result;
                $("#img_url").attr("value", e.target.result);
                
            }
            reader.readAsDataURL(input.files[0]);
        }
    } else {
        alert ("FileReader is not supported by this browser.");
    }
}