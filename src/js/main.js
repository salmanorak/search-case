const searchMovieController = {
    init: function (opts){
        self = this;
        $.extend(this.options, opts);
        this.data.favList = this.functions.getFavListData();
        this.data.prevSearchList = this.functions.getPreviousSearchData();
        if(!(this.options.url && this.options.apiKey)){
            this.app.html('<h1>Url and apikey is mandatory for this app. Please supply these information to use app</h1>')
        }
    },
    onload: function (){
        this.domKeys = {
            input : this.app.find('#search-input'),
            searchButton : this.app.find('.search-button'),
            error : this.app.find('.error'),
            prevSearch :{
                container: this.app.find('.previous-search'),
                itemList: this.app.find('.previous-search .list'),
            },
            resultList: {
                container: this.app.find('#result-list'),
                itemList: this.app.find('#result-list .items'),
                noResultPlaceHolder: this.app.find('.placeholder.no-result'),
                loadingPlaceHolder : this.app.find('.placeholder.loading'),
            },
            favList: {
                container: this.app.find('#fav-list'),
                itemList: this.app.find('#fav-list .items') 
            }
        }
        this.eventBinding();
        this.functions.createAndAppendMovieList();
        this.functions.createAndAppendPrevSearchList();
        this.functions.setErrorMessage();
        this.functions.assignMinLength();
    },
    app : $('#app'),
    options:{
        minSearchCharCount : 3, 
        maxMovieResultCount : 0, 
        maxPrevSearchCount : 10
    },
    data: { 
        movieList : [],
        favList : [],
        prevSearchList: [],
    },
    MovieDataModel : function Movie (list){
        return list.map(({Title :name, Poster : imageUrl, Year: year, imdbID:id, Type: type})=> {   
            let ratingScore = 4.7 // ratingScore added manually;
            let isFav
            imageUrl = imageUrl == 'N/A' ? 'src/asset/img/placeholderimg.png' : imageUrl
            
            return {name,imageUrl,year,id,type,ratingScore,isFav} 
        })
    },
    functions: {
        setMovieList(list=[]){
            self.data.movieList = new self.MovieDataModel(list);
            self.data.movieList.forEach( movieItem => movieItem.isFav = self.data.favList.some(item=> item.id == movieItem.id))
            if(self.options.maxMovieResultCount) self.data.movieList = self.data.movieList.slice( 0, self.options.maxMovieResultCount )

            if(self.data.movieList.length){
                $(self.templates.createMovieList(self.data.movieList))
                    .appendTo(self.domKeys.resultList.itemList)
                    .hide()
                    .fadeIn(500);
                this.hideNoResult();
            }else{
                this.showNoResult();
            }
        },
        searchByString (str=''){
            fnc = this;
            if(str.length >= self.options.minSearchCharCount){
                this.addToPrevList(str);
                $.ajax({
                    url: self.options.url,            
                    method: 'GET',
                    type: 'json',
                    data: {'apikey': self.options.apiKey, 's': str.trim() },
                    crossDomain: true,
                    dataType: 'jsonp',
                    success: function (response) {
                        fnc.setMovieList(response.Search)
                    },
                    error: function (error) {
                        console.log(error);
                    },
                    beforeSend: function() {
                        fnc.setSearchMessage(str);
                        fnc.clearMovieList();
                        fnc.setIsLoading(true);
                    },
                    complete: function(){
                        fnc.setIsLoading(false)
                    }
                });
            }
        },
        createAndAppendMovieList(){
            if(self.data.favList.length){
                $(self.templates.createMovieList(self.data.favList))
                    .appendTo(self.domKeys.favList.itemList)
                    .hide()
                    .fadeIn();
            } 
        },
        createAndAppendPrevSearchList(){
            if(self.data.prevSearchList.length){
                $(self.templates.createPrevSearchList(self.data.prevSearchList))
                    .appendTo(self.domKeys.prevSearch.itemList)
                    .hide()
                    .fadeIn();
            } 
        },
        assignMinLength(){
            self.domKeys.input.attr('minLength', self.options.minSearchCharCount)
        },
        showNoResult(){
            self.domKeys.resultList.noResultPlaceHolder.addClass('show')
        },
        hideNoResult(){
            self.domKeys.resultList.noResultPlaceHolder.removeClass('show')
        },
        setIsLoading (state){
            if(state){
                self.domKeys.resultList.loadingPlaceHolder.addClass('show')
                self.domKeys.searchButton.addClass('searching')
                    .find('span')
                    .text('Searching')
                this.hideNoResult()
            }else{
                self.domKeys.resultList.loadingPlaceHolder.removeClass('show')
                self.domKeys.searchButton.removeClass('searching')
                    .find('span')
                    .text('Search')
            }
        },
        clearMovieList(){
            self.domKeys.resultList.itemList.html('')
        },
        setErrorMessage(){
            self.domKeys.error.text(`type at least ${self.options.minSearchCharCount} characters`)
        },
        setSearchMessage(str){
            self.domKeys.resultList.loadingPlaceHolder.find('span').text(`Searching for ${str}`);
        },
        //helper functions
        getPreviousSearchData(){
            let result = JSON.parse(localStorage.getItem('prevSearch'))
            return result ? result : [] 
        },
        setPreviousSearchData(data){
            localStorage.setItem('prevSearch',JSON.stringify(data))
        },
        addToPrevList(str){
            if(!self.data.prevSearchList.includes(str)){
                if(self.data.prevSearchList.length >= self.options.maxPrevSearchCount){
                    this.removePrevList(self.data.prevSearchList[0]);
                }
                self.data.prevSearchList.push(str);
                this.setPreviousSearchData(self.data.prevSearchList);
                $(self.templates.createPrevSearchList([str])).appendTo(self.domKeys.prevSearch.itemList);
            }
            self.domKeys.prevSearch.container.slideDown();
        },
        removePrevList(str){
            let index = self.data.prevSearchList.indexOf(str)
            let elem = self.domKeys.prevSearch.container.find(`.list-item[data='${str}']`);
            self.data.prevSearchList.splice(index,1)
            this.setPreviousSearchData(self.data.prevSearchList);
            elem.fadeOut(600, ()=>{elem.remove()});
            if(self.data.prevSearchList.length === 0) self.domKeys.prevSearch.container.slideUp();
        },
        getFavListData(){
            let result = JSON.parse(localStorage.getItem('favList'))
            return result ? result : []
        },
        setFavListData (data){
            localStorage.setItem('favList',JSON.stringify(data))
        },
        addToFavList(movie){
            self.data.favList.push(movie)
            $(self.templates.createMovieList([movie])).appendTo(self.domKeys.favList.itemList);
            this.setFavListData(self.data.favList)
        },
        removeFavList (movie){
            let index = self.data.favList.indexOf(movie)
            let elem = self.domKeys.favList.itemList.find(`[data-id='${movie.id}']`);
            self.data.favList.splice(index,1)
            this.setFavListData(self.data.favList);
            elem.fadeOut(()=>{elem.remove()});
        }

    },
    validation:{
        validateInput(el){
            let str = el.val()
            let minLength = el.attr('minLength')
            if(str.length < minLength){
                el.addClass('has-error')
                self.domKeys.error.show()
                self.domKeys.searchButton.addClass('disabled')
                return false
            }else{
                self.domKeys.error.hide()
                el.removeClass('has-error')
                self.domKeys.searchButton.removeClass('disabled')   
                return true     
            }
        }
    },
    templates : {
        createMovieList(list){
            return list.map(({id,name,imageUrl,isFav,ratingScore,year,type}) =>
             `<div class="item-card" data-id="${id}">
                 <div class="poster">
                     <img class="image" alt="${name} - poster" src="${imageUrl}"></img>
                     <div class="overlay">
                         <span class="item rating">
                             <span class="${isFav ? 'fav ':'' }icon"></span>
                              ${ratingScore}
                         </span>
                         <span class="item year">${year}</span>
                     </div>
                 </div>
                 <div class="detail">
                     <div class="title">${name}</div>
                     <div class="type">${type}</div>
                 </div>
             </div>`
             ).join('');
         },
         createPrevSearchList (list){
            return list.map(item =>
             `<div class="list-item" data="${item}"=>
                <span>${item}</span>
                <em class="close far fa-times-circle"></em>
            </div>`
             ).join('');
         }
    },
    eventHandlers:{
        searchInputValidation : (e)=>{
            self.validation.validateInput($(e.target))
        },
        searchInputKeyPressed : (e)=>{
            if(e.which=='13'){
                self.functions.searchByString(self.domKeys.input.val());
            }
        },
        searchEventHandler : (e)=>{
            if(!self.validation.validateInput(self.domKeys.input)) return false;
            self.functions.searchByString(self.domKeys.input.val());
        },
        favIconClickHandler: (e)=>{
            let movieId = $(e.target).parents('.item-card').attr('data-id')
            let movie;
            if(self.data.movieList.length){
                movie = self.data.movieList.find((item)=>{ return item.id === movieId});
            }else{
                movie = self.data.favList.find((item)=>{ return item.id === movieId});
            }
            if(movie && !movie.isFav){
                $(e.target).addClass('fav')
                movie.isFav= true;
                self.functions.addToFavList(movie);
            }else if(movie){
                let itemInResultList = self.domKeys.resultList.itemList.find(`[data-id='${movie.id}']`)
                itemInResultList && itemInResultList.find('.icon').removeClass('fav');
                movie.isFav = false
                self.functions.removeFavList(movie)
            }
        },
        prevSearchClickHandler: (e)=>{
            let str = $(e.currentTarget).find('span').text()
            if($(e.target).hasClass('close')){
                self.functions.removePrevList(str)
            }else{
                self.domKeys.input.val(str).blur()
                self.functions.searchByString(str);
            }
        }
    },
    eventBinding: function(){
        this.domKeys.input.on('keyup blur' , this.eventHandlers.searchInputValidation)
        this.domKeys.input.on('keydown' , this.eventHandlers.searchInputKeyPressed)
        this.domKeys.input.attr('minLength',this.minSearchCharCount)
        this.domKeys.searchButton.on('click' , this.eventHandlers.searchEventHandler)
        this.app.on('click','.icon', this.eventHandlers.favIconClickHandler)
        this.app.on('click','.previous-search .list .list-item' , this.eventHandlers.prevSearchClickHandler)
    }
}

const options = {
    apiKey: '9397ebd6',
    url: 'https://www.omdbapi.com/',
}

// Controller Initiated
searchMovieController.init(options)
$(document).ready(()=>{
    searchMovieController.onload();
})