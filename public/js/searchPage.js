var APIKEY;
var id;

const amazonOpt = ['Most Relevence', 'Price: Low to High', 'Price: High to Low', 'Customer Reviews', 'Date: Latest to Oldest'];
const walmartOpt = ['Best Match', 'Best Seller', 'Price: Low to High', 'Price: High to Low', 'Ratings', 'Newest'];

const amazonSort = ['relevanceblender', 'price-asc-rank', 'price-desc-rank', 'review-rank', 'date-desc-rank'];
const walmartSort = ['best_match', 'best_seller', 'price_low', 'price_high', 'rating_high', 'new'];

// takes input from getWalmartDetails()/getAmazonDetails()
function buildList(data, prodURL){
    id++;
    $('.prodList').append(`
                <li class="list-group-item" style="margin-top: 1%; margin-bottom: 1%; background-color: #135300;">
                    <h3 id='${id}'>
                        <span style="color: #FFFFE4;">${data.productTitle}</span>
                        <a href="${prodURL}" target="blank" style="font-size: 20px; color: #A9DF9C;">Link to Buy</a>
                        <span style="float: right; color: #FFFFE4;">$${data.price} <button type="button" class="badge badge-primary addBtn" data-id='${id}' style="background-color: #A9DF9C; color: #FFFFE4;"><i class="fas fa-plus"></i></button></span>
                    </h3>
                </li>
                `);
}

// linked to buildList()
function getAmazonDetails(ASIN){
    const url = 'https://www.amazon.ca/dp/' + ASIN;
    $.ajax({
        url: 'https://axesso-axesso-amazon-data-service-v1.p.rapidapi.com/amz/amazon-lookup-product?url=' + url,
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'axesso-axesso-amazon-data-service-v1.p.rapidapi.com',
            'x-rapidapi-key': APIKEY
        }
    }).then(function(response) {
        console.log(response);
        buildList(response, url);
    }).catch(function(err){
        console.log(err);
    });
}

// linked to buildList()
function getWalmartDetails(URL){
    // product URL, can be used as "Link to Buy"
    const url = 'https://www.walmart.com' + URL;
    $.ajax({
        url: 'https://axesso-walmart-data-service.p.rapidapi.com/wlm/walmart-lookup-product?url=' + url,
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'axesso-walmart-data-service.p.rapidapi.com',
            'x-rapidapi-key': APIKEY
        }
    }).then(function (response) {
        console.log(response);
        buildList(response, url);
    // .catch for printing error detials
    }).catch(function(err){
        console.log(err);
    });
}

// linked to getAmazonDetails()
function amazonRequest(url){
    $('.loadSign').css('display', 'block');
    $.ajax({
        url: 'https://axesso-axesso-amazon-data-service-v1.p.rapidapi.com/amz/amazon-search-by-keyword-asin?' + url,
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'axesso-axesso-amazon-data-service-v1.p.rapidapi.com',
            'x-rapidapi-key': APIKEY
        }
    }).then(function(response) {
        console.log(response);
        $('.prodList').empty(); // empty everything that was in list
        id = 0;
        // for each product in the response, get its details. LIMITING TO 5
        for(let i=0; i < 5; i++) {
            getAmazonDetails(response.foundProducts[i])
        }
        $('.loadSign').css('display', 'none');
        //response.foundProducts.forEach( i => getAmazonDetails(i) );
    }).catch(function(err){
        console.log(err);
    });
}

// linked to getWalmarDetails()
function walmartRequest(url){
    $('.loadSign').css('display', 'block');
    $.ajax({
        url: 'https://axesso-walmart-data-service.p.rapidapi.com/wlm/walmart-search-by-keyword?' + url,
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'axesso-walmart-data-service.p.rapidapi.com',
            'x-rapidapi-key': APIKEY
        }
    }).then(function(response){
        console.log(response);
        $('.prodList').empty(); // empty everything that was in list
        id = 0;
        // for each product in the response, get its details. LIMITING TO 5
        for(let i=0; i < 5; i++){
            getWalmartDetails(response.foundProducts[i])
        }
        $('.loadSign').css('display', 'none');
        // response.foundProducts.forEach( i => getWalmartDetails(i) ); // for each product in the response, get its details
    // .catch for printing error detials
    }).catch(function(err){
        console.log(err);
    });
}

// building API call URLs depanding on store selection
function builtURL(type){
    var sortBy;
    var keyword;
    switch(type){
    case 'amazon':
        keyword = $('.form-control').val().trim();
        sortBy = $('#sortList').val();
        amazonRequest(`sortBy=${sortBy}&domainCode=ca&keyword=${keyword}&page=1`);
        break;
    case 'walmart':
        keyword = $('.form-control').val().trim();
        sortBy = $('#sortList').val();
        walmartRequest(`sortBy=${sortBy}&page=1&keyword=${keyword}&type=text`);
        break;
    default:
        break;
    }
}

// will run everything in here when the page is fully loaded
$(document).ready(function(){

    $.ajax('/apiKey', {
        type: 'GET'
    }).then(function(response){
        APIKEY = response;
    }).catch(function(err){
        console.log(err);
    });

    // checking if user pressed enter while focused in input
    $('.form-control').on('keydown', function(event){
        // if key pressed is not enter, prevent sending API calls
        if(event.keyCode != 13) {
            return;
        }
        // if user didn't enter anything, prevent sending API calls
        if($('.form-control').val().trim() === '') {
            return;
        }
        // starting sequence for API calls
        builtURL($('#storeList').val());
    })

    // checking if user has pressed the serach button
    $('.searchBtn').on('click', function(event){
        // if user didn't enter anything, prevent sending API calls
        if($('.form-control').val().trim() === '') {
            return;
        }
        // starting sequence for API calls
        builtURL($('#storeList').val());
    });

    // adding new products to the wishlist
    $(document).on('click', '.addBtn', function(event){
        const children = $(`#${$(this).data('id')}`).children(); // getting all the info
        $.ajax('/api/items', {
            type: 'POST',
            data: {
                name: children[0].innerText,
                link: children[1].getAttribute('href')
            }
        }).then(function(response){
            if(response.affectedRows > 0) {
                console.log('[200]: Successful');
            } else {
                console.log('[400]: Check data ');
                return;
            }
        }).catch(function(err){
            console.log(err);
        });
    });

    // check the selected value when the user selected something in the dropdown list
    $('#storeList').on('change', function(){
        $('#sortList').removeAttr('disabled'); // enable the sorting option dropdown list
        $('#sortList').empty(); // empty every options that were in the list
        // based on which store the user has selected, print corresponding sorting to the sorting option dropdown list
        switch ($('#storeList').val()){
        case 'amazon':
            amazonOpt.forEach(function(i){
                $('#sortList').append(`<option value='${amazonSort[amazonOpt.indexOf(i)]}'>${i}</option>`);
            });
            break;
        case 'walmart':
            walmartOpt.forEach(function(i){
                $('#sortList').append(`<option value='${walmartSort[walmartOpt.indexOf(i)]}'>${i}</option>`);
            });
            break;
        default:
            // user selected the first option in the store dropdown list, sorting option dropdown list becomes disabled
            $('#sortList').empty(); // empty every options that were in the list
            $('#sortList').attr('disabled', true); // disabling the sorting option dropdown list
            break;
        }
    });
});