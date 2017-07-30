var d;
var hlco = new Array();
var canvas;
chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    var url = tabs[0].url;
    url = url.replace(/.*listings\//, '');
    url = url.replace(/\?.*/, '');
    var splited_url = url.split('/');
    var app_id =splited_url[0];
    var hash_name = splited_url[1];
    var get_url = "http://steamcommunity.com/market/pricehistory/?country=ZN&appid=" + app_id +"&market_hash_name=" + hash_name;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", get_url, true);
    xhr.withCredentials = true;
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            result = xhr.responseText;
            var date_price_pairs = JSON.parse(result).prices;
            canvas = document.getElementById('price_canvas');
            d = date_price_pairs;
            paint_candlestick_chart(canvas, date_price_pairs);
            canvas.addEventListener("mousemove", onMouseMove, false);
            container.onscroll = onscroll_func;
        }
    }
    xhr.send();
});
var td_open = document.getElementById('open');
var td_close = document.getElementById('close');
var td_high = document.getElementById('high');
var td_low = document.getElementById('low');
var h1_date = document.getElementById('date');
var h1_sold = document.getElementById('sold_amount');
function onMouseMove(e) {
    e.stopPropagation();
    var cursor = {
        x: e.offsetX || e.originalEvent.layerX,
        y: e.offsetY || e.originalEvent.layerY
    };
    var i = parseInt((cursor.x - left_margin) / candlestick_width);
    h1_date.innerText = d[i * number_of_days_each_candlestick][0].substring(0,11)
    + " - " + d[(i + 1) * number_of_days_each_candlestick - 1][0].substring(0,11);
    h1_sold.innerText = "交易量: " + d[i * number_of_days_each_candlestick][2];
    td_high.innerText = "最高: ￥ " + hlco[i][0].toFixed(2);
    td_low.innerText = "最低: ￥ " + hlco[i][1].toFixed(2);
    td_open.innerText = "开盘: ￥ " + hlco[i][2].toFixed(2);
    td_close.innerText = "收盘: ￥ " + hlco[i][3].toFixed(2);
    paint_candlestick_chart(canvas, d, i);
}
var candlestick_width = 7;
var top_margin = 20;
var bottom_margin = 100;
var left_margin = 55;
var number_of_days_each_candlestick = 7;
var sold_height = 70;
function paint_candlestick_chart (canvas, date_price_pairs, high_light) {
    var prices = new Array();
    date_price_pairs.forEach(function(pair) {
        prices.push(pair[1]);
    }, this);
    var number_of_days_total = date_price_pairs.length;
    var number_of_candlesticks = Math.floor(number_of_days_total / number_of_days_each_candlestick);

    canvas.width = number_of_candlesticks * candlestick_width;
    canvas.height = 350;
    canvas.style.width = canvas.width;
    canvas.style.height = canvas.height;
    
    var ctx = canvas.getContext('2d');
    ctx.lineWidth = 1;
    var height = canvas.height;
    var width = canvas.width;
    ctx.clearRect(0, 0, width, height);
    var start = parseInt(container.scrollLeft / candlestick_width);
    var end = parseInt(500 / candlestick_width + start);
    end = end > number_of_days_total ? number_of_days_total : end;
    start = start < 0 ? 0 : start;
    var highest_price = prices[start * number_of_days_each_candlestick];
    var lowest_price = prices[start * number_of_days_each_candlestick];
    for(var i = start; i < end; ++i) {
        for(var j = 0; j < number_of_days_each_candlestick; ++j) {
            var p = prices[i * number_of_days_each_candlestick + j];
            if(p > highest_price)
                highest_price = p;
            if(p < lowest_price)
                lowest_price = p;
        }
    }
    var ratio = (height - bottom_margin - top_margin) / (highest_price - lowest_price);

    ctx.beginPath();
    ctx.moveTo(parseInt(container.scrollLeft + left_margin - candlestick_width / 2), top_margin);
    ctx.lineTo(parseInt(container.scrollLeft + left_margin - candlestick_width / 2), height - bottom_margin);
    ctx.strokeStyle = '#8F98A0';
    ctx.lineWidth = 0.1;
    ctx.stroke();
    
    var ln = 3;
    var h = highest_price;
    var l = lowest_price;
    var d = (h - l) / (ln);
    for(var i = 0; i < ln + 1; ++i) {
        var y = parseInt(height - ((l + i*d - lowest_price) * ratio) - bottom_margin);
        ctx.font = "Arial, Helvetica, Verdana, sans-serif";
        ctx.fillStyle = "#8F98A0";
        var p = '￥ ' + (l + i*d).toFixed(2);
        ctx.fillText(p , container.scrollLeft + 5, y + parseInt(ctx.font) / 2);
        ctx.beginPath();
        ctx.moveTo(parseInt(container.scrollLeft + left_margin - candlestick_width / 2), y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = '#8F98A0';
        ctx.lineWidth = 0.1;
        ctx.stroke();
    }

    var sold_amounts = new Array();
    var largest_sold_amount = 0;
    for(var i = start; i < end; ++i) {
        sold_amounts[i] = 0;
        for(var j = 0; j < number_of_days_each_candlestick; ++j) {
            sold_amounts[i] += parseInt(date_price_pairs[i * number_of_days_each_candlestick + j][2]);
        }
        if(largest_sold_amount < sold_amounts[i]) {
            largest_sold_amount = sold_amounts[i];
        }
    }
    ctx.beginPath();
    ctx.moveTo(start*candlestick_width + left_margin+ candlestick_width / 2, height - sold_amounts[start] * sold_height / largest_sold_amount - 5);
    for(var i = start; i < end; ++i) {
        if(high_light == i) {
            ctx.arc(i*candlestick_width + left_margin+ candlestick_width / 2, height -  sold_amounts[i] * sold_height / largest_sold_amount - 5, 1, 0, Math.PI * 2, false); 
        }
        ctx.lineTo( i*candlestick_width + left_margin + candlestick_width / 2, height -  sold_amounts[i] * sold_height / largest_sold_amount - 5);
        ctx.strokeStyle = '#8F98A0';
        ctx.lineWidth = 1;
    }
    ctx.stroke();
    ctx.font = "Arial, Helvetica, Verdana, sans-serif";
    ctx.fillStyle = "#8F98A0";
    ctx.fillText(largest_sold_amount,container.scrollLeft + 5 , height - sold_height + parseInt(ctx.font) / 2 - 5);
    ctx.beginPath();
    ctx.moveTo(container.scrollLeft + left_margin - 5, height -  sold_height - 5);
    ctx.lineTo(width, height - sold_height - 5);
    ctx.moveTo(container.scrollLeft + left_margin - 5, height - 5);
    ctx.lineTo(width, height - 5);
    ctx.strokeStyle = '#8F98A0';
    ctx.lineWidth = 0.1;
    ctx.stroke();
    ctx.fillText('0', container.scrollLeft + 5 , height  + parseInt(ctx.font) / 2- 5);

    ctx.fillText(sold_amounts[high_light], container.scrollLeft + 5 , height - sold_amounts[high_light] * sold_height / largest_sold_amount + parseInt(ctx.font) / 2- 5);
    ctx.beginPath();
    ctx.moveTo(container.scrollLeft + left_margin - 5, parseInt(height - sold_amounts[high_light] * sold_height / largest_sold_amount - 5));
    ctx.lineTo(width, parseInt(height - sold_amounts[high_light] * sold_height / largest_sold_amount - 5));
    ctx.stroke();


    for(var i = start; i < end; ++i) {
        if(high_light == i) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(i * candlestick_width  + left_margin , top_margin, candlestick_width, height - bottom_margin - top_margin);
        }
        if(i % 10 == 0) {  
            if(i * candlestick_width > parseInt(container.scrollLeft + left_margin - candlestick_width / 2)) {
                ctx.font = "Arial, Helvetica, Verdana, sans-serif";
                ctx.fillStyle = "#8F98A0";
                var date = date_price_pairs[i][0].substring(0,11);
                ctx.fillText(date, i * candlestick_width - ctx.measureText(date).width / 2, height - bottom_margin + parseInt(ctx.font) + 5);
                ctx.beginPath();
                ctx.moveTo(i * candlestick_width, top_margin);
                ctx.lineTo(i * candlestick_width, height - bottom_margin);
                ctx.strokeStyle = "#8F98A0";
                ctx.lineWidth = 0.1;
                ctx.stroke();
            }
        }
        var open = prices[i * number_of_days_each_candlestick];
        var close = prices[(i + 1) * number_of_days_each_candlestick - 1];
        var high = open;
        var low = open;
        for(var j = 0; j < number_of_days_each_candlestick; ++j) {
            var p = prices[i * number_of_days_each_candlestick + j];
            if(high < p)
                high = p;
            if(low > p)
                low = p;
        }
        hlco[i] = [high, low, open, close];
        var color = open < close ? '#fff' : '#0f0';
        y = height - ((high - lowest_price) * ratio) - bottom_margin;
        h = (high - low)*ratio;
        ctx.beginPath();
        ctx.moveTo((i + 0.5) * candlestick_width + left_margin, y);
        ctx.lineTo((i + 0.5) * candlestick_width + left_margin, y + h);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
        if(open > close){
            high = open;
            low = close;
        } else {
            high = close;
            low = open;
        }
        y = height - ((high - lowest_price) * ratio) - bottom_margin;
        h = (high - low)*ratio;
        ctx.fillStyle = color;
        ctx.fillRect(i * candlestick_width + 1  + left_margin , y, candlestick_width -2, h);
    }
    
}
var container = document.getElementById('container');
function onscroll_func() {
    var canvas = document.getElementById('price_canvas');
    paint_candlestick_chart(canvas, d);
}

