//controller options
const options = {
    apiKey: '9397ebd6',
    url: 'https://www.omdbapi.com/',
    appSelector : $('#app'),
}

// Controller Initiated
const controller = new SearchBoxController(options)
$(document).ready(()=>{
    controller.init();
})

//Controller and default options values
function SearchBoxController({apiKey, url, appSelector, minSearchCharCount=3, maxMovieResultCount=0}, maxPrevSearchCount=10) {   
    //DataModel for movie item
    function MovieDataModel(list){
        return list.map(({Title :name, Poster : imageUrl, Year: year, imdbID:id, Type: type})=> {   
            let ratingScore = 4.7 // ratingScore added manually;
            let isFav
            imageUrl = imageUrl == 'N/A' ? 'src/asset/img/placeholderimg.png' : imageUrl
            
            return {name,imageUrl,year,id,type,ratingScore,isFav} 
        })
    }
    //states and data
    let movieList= [];
    let favList= [];
    let prevSearchList = [];

    //initial setup function
    init = () =>{
        //events
        domKeys.input.on('keyup blur' , eventHandlers.searchInputValidation)
        domKeys.input.on('keydown' , eventHandlers.searchInputKeyPressed)
        domKeys.input.attr('minLength',minSearchCharCount)
        domKeys.searchButton.on('click' , eventHandlers.searchEventHandler)
        appSelector.on('click','.icon', eventHandlers.favIconClickHandler)
        appSelector.on('click','.previous-search .list .list-item' , eventHandlers.prevSearchClickHandler)
        
        //read and assign initial data
        setErrorMessage();
        favList = getFavListData();
        if(favList.length){
            $(createMovieList(favList)).appendTo(domKeys.favList.itemList).hide().fadeIn();
        }
        prevSearchList = getPreviousSearchData();
        if(prevSearchList.length){
            $(createPrevSearchList(prevSearchList)).appendTo(domKeys.prevSearch.itemList)
        }else{
            domKeys.prevSearch.container.hide();
        }
    };

    //business logic
    setMovieList= (list=[])=>{
        clearList()
        movieList = new MovieDataModel(list);
        movieList.forEach( movieItem => movieItem.isFav = favList.some(item=> item.id == movieItem.id))
        if(maxMovieResultCount) movieList = movieList.slice( 0, maxMovieResultCount )

        if(movieList.length){
            $(createMovieList(movieList)).appendTo(domKeys.resultList.itemList).hide().fadeIn(500);
            hideNoResult();
        }else{
            setNoResult();
        }
    };

    searchByString = (str='')=>{
        if(domKeys.searchButton.hasClass('disabled')) return;
        domKeys.resultList.itemList.html('')
        if(str.length >= minSearchCharCount){
            addToPrevList(str);
            $.ajax({
                url: url,            
                method: 'GET',
                type: 'json',
                data: {'apikey':apiKey, 's':str.trim() },
                crossDomain: true,
                dataType: 'jsonp',
                success: function (response) {
                    setMovieList(response.Search)
                },
                error: function (error) {
                    console.log(error);
                },
                beforeSend: function() {
                    setIsLoading(true)
                    setSearchMessage(str)
                },
                complete: function(){
                    setIsLoading(false)
                }
            });
        }
    };

    // HTML Templates
    createMovieList= (list)=>{
       return list.map(item =>
        `<div class="item-card" data-id="${item.id}">
            <div class="poster">
                <img class="image" alt="${item.name} - poster" src="${item.imageUrl}"></img>
                <div class="overlay">
                    <span class="item rating">
                        <span class="${item.isFav ? 'fav ':'' }icon"></span>
                         ${item.ratingScore}
                    </span>
                    <span class="item year">${item.year}</span>
                </div>
            </div>
            <div class="detail">
                <div class="title">${item.name}</div>
                <div class="type">${item.type}</div>
            </div>
        </div>`
        ).join('');
    };
    createPrevSearchList = (list)=>{
        return list.map(item =>
         `<div class="list-item" data="${item}"=>
            <span>${item}</span>
            <em class="close far fa-times-circle"></em>
        </div>`
         ).join('');
     };

    // Dom references
    const domKeys = ((app)=>{
        return{
            input : app.find('#search-input'),
            searchButton : app.find('.search-button'),
            error : app.find('.error'),
            prevSearch :{
                container: app.find('.previous-search'),
                itemList:app.find('.previous-search .list'),
            },
            resultList: {
                container: app.find('#result-list'),
                itemList: app.find('#result-list .items'),
                noResultPlaceHolder: app.find('.placeholder.no-result'),
                loadingPlaceHolder : app.find('.placeholder.loading'),
            },
            favList: {
                container:app.find('#fav-list'),
                itemList:app.find('#fav-list .items') 
            }
        }
    })(appSelector);

    //UI functions
    setNoResult = ()=>{
        domKeys.resultList.noResultPlaceHolder.addClass('show')
    }
    hideNoResult = ()=>{
        domKeys.resultList.noResultPlaceHolder.removeClass('show')
    }
    setIsLoading= (state)=>{
        if(state){
            domKeys.resultList.loadingPlaceHolder.addClass('show')
            domKeys.searchButton.addClass('searching')
                                .find('span')
                                .text('Searching')
            hideNoResult()
        }else{
            domKeys.resultList.loadingPlaceHolder.removeClass('show')
            domKeys.searchButton.removeClass('searching')
                                .find('span')
                                .text('Search')
        }
    }
    clearList= ()=>{
        domKeys.resultList.itemList.html('')
    }
    setErrorMessage= ()=>{
        domKeys.error.text(`type at least ${minSearchCharCount} characters`)
    }
    setSearchMessage= (str)=>{
        domKeys.resultList.loadingPlaceHolder.find('span').text(`Searching for ${str}`);
    }   

    //helper functions
    getPreviousSearchData = () =>{
        let result = JSON.parse(localStorage.getItem('prevSearch'))
        return result ? result : [] 
    };
    setPreviousSearchData= (data)=>{
        localStorage.setItem('prevSearch',JSON.stringify(data))
    };
    addToPrevList= (str)=>{
        if(!prevSearchList.includes(str)){
            if(prevSearchList.length >= maxPrevSearchCount){
                removePrevList(prevSearchList[0]);
            }
            prevSearchList.push(str);
            setPreviousSearchData(prevSearchList);
            $(createPrevSearchList([str])).appendTo(domKeys.prevSearch.itemList);
        }
        domKeys.prevSearch.container.slideDown();
    }
    removePrevList= (str)=>{
        let index = prevSearchList.indexOf(str)
        let elem = domKeys.prevSearch.container.find(`.list-item[data='${str}']`);
        prevSearchList.splice(index,1)
        setPreviousSearchData(prevSearchList);
        elem.fadeOut(600, ()=>{elem.remove()});
        if(prevSearchList.length === 0) domKeys.prevSearch.container.slideUp();
    }
    getFavListData = () =>{
        let result = JSON.parse(localStorage.getItem('favList'))
        return result ? result : []
    };
    setFavListData= (data)=>{
        localStorage.setItem('favList',JSON.stringify(data))
    };
    addToFavList= (movie)=>{
        favList.push(movie)
        $(createMovieList([movie])).appendTo(domKeys.favList.itemList);
        setFavListData(favList)
    }
    removeFavList= (movie)=>{
        let index = favList.indexOf(movie)
        let elem = domKeys.favList.itemList.find(`[data-id='${movie.id}']`);
        favList.splice(index,1)
        setFavListData(favList);
        elem.fadeOut(()=>{elem.remove()});
    }
    validateInput= (el)=>{
        let str = el.val()
        let minLength = el.attr('minLength')
        if(str.length < minLength){
            el.addClass('has-error')
            domKeys.error.show()
            domKeys.searchButton.addClass('disabled')
            return false
        }else{
            domKeys.error.hide()
            el.removeClass('has-error')
            domKeys.searchButton.removeClass('disabled')   
            return true     
        }
    }

    // Event Handlers
    eventHandlers =(()=> {
        return{
            searchInputValidation : (e)=>{
                validateInput($(e.target))
            },

            searchInputKeyPressed : (event)=>{
                if(event.which=='13'){
                    searchByString(domKeys.input.val());
                }
            },

            searchEventHandler : (event)=>{
                if(!validateInput(domKeys.input)) return false;
                searchByString(domKeys.input.val());
            },

            favIconClickHandler: (e)=>{
                let movieId = $(e.target).parents('.item-card').attr('data-id')
                let movie;
                if(movieList.length){
                    movie = movieList.find((item)=>{ return item.id === movieId});
                }else{
                    movie = favList.find((item)=>{ return item.id === movieId});
                }
                if(movie && !movie.isFav){
                    $(e.target).addClass('fav')
                    movie.isFav= true;
                    addToFavList(movie);
                }else if(movie){
                    let itemInResultList =domKeys.resultList.itemList.find(`[data-id='${movie.id}']`)
                    itemInResultList && itemInResultList.find('.icon').removeClass('fav');
                    movie.isFav = false
                    removeFavList(movie)
                }

            },

            prevSearchClickHandler: (e)=>{
                let str = $(e.currentTarget).find('span').text()
                if($(e.target).hasClass('close')){
                    removePrevList(str)
                }else{
                    domKeys.input.val(str).blur()
                    searchByString(str);
                }
            }
        }
    })()

    return {
        init, // only init method is accessible from outside of controller.
    }
}
