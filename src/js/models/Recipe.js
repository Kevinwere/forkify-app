import axios from 'axios';

export default  class Recipe{
    constructor(id){
       this.id=id; 
    }
  async getRecipe(){
        try{
            const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);
            console.log(res);
            this.title=res.data.recipe.title; 
            this.author=res.data.recipe.publisher
            this.img=res.data.recipe.image_url;
            this.url=res.data.recipe.source_url;
            this.ingredients=res.data.recipe.ingredients; 
             
        }catch(error){
            console.log(error)
        }
    }
    calcTime(){
        //assuming that we need 15 min for each 3 ingredients
        const numIng = this.ingredients.length;
        const period =Math.ceil(numIng/3);
        this.time = period * 15;
    }
    calcServing(){
        this.servings=4;
    }
    parseIngredients(){
        const unitLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspoons', 'teaspoon', 'cups', 'pounds'];
        const unitshort = ['tbsp', 'tbsp', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound'];
        const newIngredients = this.ingredients.map(el=>{
            //uniform units
            let ingredient = el.toLowerCase();
            unitLong.forEach((unit,i)=>{
                ingredient=ingredient.replace(unit,unitshort[i]);
            });
            //remove parenthesis
            ingredient=ingredient.replace(/ *\([^)]*\) */g, ' ');
            //parse ingredients
            const arrIng = ingredient.split(' ');
            const unitIndex = arrIng.findIndex(el2=>unitshort.includes(el2));
            let objIng;
            if(unitIndex > -1){
                //there is a unit
                //Ex.4 1/2 cups, arrCount is [4,1/2]
                //Ex. 4 cups, arrCount is 4
                const arrCount =arrIng.slice(0,unitIndex);
                
                let count;
                if(arrCount.length===1){
                    count =eval(arrCount[0].replace('-','+'));
                }else{
                    count = eval(arrIng.slice(0,unitIndex).join('+'));
                }
                objIng={
                    count,
                    unit:arrIng[unitIndex],
                    ingredient:arrIng.slice(unitIndex + 1).join('')
                }
                
            }else if(parseInt(arrIng[0],10)){
                //there is NO unit,but first element is a unit
                objIng = {
                    count:parseInt(arrIng[0],10),
                    unit:'',
                    ingredient:arrIng.slice(1).join('')
                }
            }else if(unitIndex===-1){
                //there is NO unit and NO number in 1st position
                objIng={
                    count:1,
                    unit:'',
                    ingredient
                }
            }
            
            return objIng;
        });
        this.ingredients = newIngredients;
    }
    updateServings(type){
        //servings
        const newServings = type === 'dec'? this.servings  - 1: this.servings + 1;
        //ingredients
        this.ingredients.forEach(ing=>{
            ing.count *=(newServings / this.servings);
        })
       this.servings = newServings; 
    }
}