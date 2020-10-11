//DataModel
function MovieDataModel(list){
    return list
        .map(({Title :name, Poster : imageUrl, Year: year, imdbID:id, Type: type})=> {   
            let ratingScore = 4.7 // ratingScore added randomly;
            let isFav
            imageUrl = imageUrl == 'N/A' ? 'https://placehold.jp/300x400.png' : imageUrl

            return {name,imageUrl,year,id,type,ratingScore,isFav} 
        })
}

//Controller
function SearchBoxController({apiKey, url, appSelector, minSearchCharCount=3, maxMovieResultCount=0}) {   
    let movieList= [];
    let favList= [];
    init = () =>{
        setErrorMessage();
        domKeys.input.on('keyup' , eventHandlers.searchInputValidation)
        domKeys.input.attr('minLength',minSearchCharCount)
        domKeys.searchButton.on('click' , eventHandlers.searchEventHandler)
        appSelector.on('click','.icon', eventHandlers.favIconClickHandler)
        favList = getFavListData();
        if(favList.length){
            $(createMovieList(favList)).appendTo(domKeys.favList.itemList).hide().fadeIn();
        }

    };
    setMovieList= (list=[])=>{
        clearList()
        movieList = new MovieDataModel(list);
        if(maxMovieResultCount) movieList = movieList.slice( 0, maxMovieResultCount )
        if(movieList.length){
            $(createMovieList(movieList)).appendTo(domKeys.resultList.itemList).hide().fadeIn(500);
            hideNoResult();
        }else{
            setNoResult();
        }
    };
    searchByString = (str='')=>{
        domKeys.resultList.itemList.html('')
        if(str.length >= minSearchCharCount){
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
                },
                complete: function(){
                    setIsLoading(false)
                }
            });
        }
    };

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

    const domKeys = ((app)=>{
        return{
            input : $(app).find('#search-input'),
            searchButton : $(app).find('.search-button'),
            error : $(app).find('.error'),
            prevSearch :{
                container: $(app).find('.previous-search'),
                itemList:$(app).find('.previous-search .list') 
            },
            resultList: {
                container: $(app).find('#result-list'),
                itemList: $(app).find('#result-list .items'),
                noResultPlaceHolder: $(app).find('.placeholder.no-result'),
                loadingPlaceHolder : $(app).find('.placeholder.loading'),
            },
            favList: {
                container:$(app).find('#fav-list'),
                itemList:$(app).find('#fav-list .items') 
            }
        }
    })(appSelector);

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
        domKeys.error.text(`Type at least ${minSearchCharCount} characters`)
    }
    getPreviousSearchData = () =>{
        let result = JSON.parse(localStorage.getItem('prevSearch'))
        return result ? result : [] 
    };
    setPreviousSearchData= (data)=>{
        localStorage.setItem('prevSearch',JSON.stringify(data))
    };
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
        favList.splice(index,1)
        setFavListData(favList);
        domKeys.favList.itemList.find(`[data-id='${movie.id}']`).remove();
    }

    eventHandlers =(()=> {
        return{
            searchInputValidation : (e)=>{
                let el= $(e.target)
                let str = el.val()
                let minLength = el.attr('minLength')
                if(str.length < minLength){
                    el.addClass('has-error')
                    domKeys.error.show()
                    domKeys.searchButton.addClass('disabled')
                }else{
                    domKeys.error.hide()
                    el.removeClass('has-error')
                    domKeys.searchButton.removeClass('disabled')        
                }
            },
            searchEventHandler : (event)=>{
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

            }
        }
    })()

    return {
        searchByString,
        init
    }
}

const options = {
    apiKey: '9397ebd6',
    url: 'https://www.omdbapi.com/',
    appSelector : $('#app'),
}

// Controller Initiated
var controller = new SearchBoxController(options)

$(document).ready(()=>{
    controller.init();
})