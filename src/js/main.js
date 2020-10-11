//DataModel
function MovieDataModel(list){
    return list
        .map(({Title :name, Poster : imageUrl, Year: year, imdbID:id, Type: type})=> {   
            let ratingScore = Number(Math.random()*10).toFixed(1) // ratingScore added randomly;
            let isFav
            imageUrl = imageUrl == 'N/A' ? 'https://placehold.jp/300x400.png' : imageUrl

            return {name,imageUrl,year,id,type,ratingScore,isFav} 
        })
}

function SearchBoxController({apiKey, url,appSelector,minSearchCharCount=3,maxMovieResultCount=0}) {   
    let movieList= [];
    let favList= []; 
    init = () =>{
        domKeys.input.on('keyup' , eventHandlers.searchEventHandler)
        favList = getFavListData();
        if(favList.length) createMovieList(favList,true)
    };
    setMovieList= (list=[])=>{
        clearList()
        movieList = new MovieDataModel(list);
        if(maxMovieResultCount) movieList = movieList.slice( 0, maxMovieResultCount )
        if(movieList.length){
            createMovieList(movieList,false);
            hideNoResult();
        }else{
            setNoResult();
        }
    };
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
    setFavListDataa= (data)=>{
        localStorage.setItem('favList',JSON.stringify(data))
    };
    searchByString = (str)=>{
        if(str && str.length < minSearchCharCount) return undefined;
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
    };
    createMovieList= (list,isFav,time=300)=>{
        list.map(item =>{
        let elemHTML = `<div class="item-card" data-id="${item.id}">
            <div class="poster">
                <img class="image" alt="${item.name} - poster" src="${item.imageUrl}"></img>
                <div class="overlay">
                    <span class="item rating">
                        <span class="${item.isFav ? fav:'' }icon"></span>
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
        isFav ? 
            domKeys.favList.itemList.append($(elemHTML)).hide().fadeIn(time)
            : domKeys.resultList.itemList.append($(elemHTML)).hide().fadeIn(time)
        });    
    };
    const domKeys = ((app)=>{
        return{
            input : $(app).find('#search-input'),
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
            hideNoResult()
        }else{
            domKeys.resultList.loadingPlaceHolder.removeClass('show')
        }
    }
    clearList= ()=>{
        domKeys.resultList.itemList.html('')
    }
    
    eventHandlers =(()=> {
        return{
            searchEventHandler : (event)=>{
                domKeys.resultList.itemList.html('')
                searchByString(event.target.value);
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
    minSearchCharCount : 6,
    maxMovieResultCount : 6
}

var controller = new SearchBoxController(options)

$(document).ready(()=>{
    controller.init();
})