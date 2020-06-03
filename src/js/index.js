import axios from "axios";
import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";
//http://forkify-api.herokuapp.com/
//const res = await axios(`https://forkify-api.herokuapp.com/api/search?&q=${this.query}`);
//const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);
/*Global state of the app
 *-search object
 *-current recipe object
 *-shopping list object
 *-liked object
 */
const state = {};

const controlSearch = async () => {
  //1.Get query from view
  const query = searchView.getInput();

  if (query) {
    //2.New search object and add to state
    state.search = new Search(query);
    //3. Prepare UI for results
    searchView.clearinput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    //4. search for recipes
    try {
      await state.search.getResults();
      //5.render results on ui
      clearLoader();
      searchView.renderResult(state.search.result);
    } catch (err) {
      console.log(err);
      clearLoader();
    }
  }
};

const listController = () => {
  //create a new list if there is none yet
  if (!state.list) state.list = new List();
  //add each ingredient to the list
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentId = state.recipe.id;
  if (!state.likes.isLiked(currentId)) {
    const newLikes = state.likes.addLike(
      currentId,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    //togle the like btn
    likesView.toggleLikeBtn(true);
    likesView.renderLike(newLikes);
  } else {
    //remove like from state
    state.likes.deleteLike(currentId);
    //togle the like btn
    likesView.toggleLikeBtn(false);
    likesView.deleteLike(currentId);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};
//restore liked recipe on page load
window.addEventListener("load", () => {
  state.likes = new Likes();
  //restore likes
  state.likes.readStorage();
  //toggle like menu btn
  likesView.toggleLikeMenu(state.likes.getNumLikes());
  //render the existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

//delete and update list item events
elements.shopping.addEventListener("click", e => {
  const id = e.target.closest(".shopping__item").dataset.itemid;
  if (e.target.matches(".shopping__delete,.shopping__delete *")) {
    //delete from state
    state.list.deleteItem(id);
    //delete from ui
    listView.deleteItem(id);
  } else if (e.target.matches(".shopping__count-value")) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

elements.searchForm.addEventListener("submit", e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", e => {
  const btn = e.target.closest(".btn-inline");

  if (btn) {
    const gotopage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResult(state.search.result, gotopage);
  }
});
const controlRescipe = async () => {
  //get id from the url
  const id = window.location.hash.replace("#", "");
  if (id) {
    //prepare Ui for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);
    //highlight selected search item
    if (state.Search) searchView.highlightSelected(id);
    //create new recipe object
    state.recipe = new Recipe(id);

    //get recipe data
    try {
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();
      //calculate serving and time
      state.recipe.calcTime();
      state.recipe.calcServing();
      //render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      console.log(error);
      console.log("error processing recipe");
    }
  }
};

// window.addEventListener('hashchange',controlRescipe);
// window.addEventListener('load',controlRescipe);
["hashchange", "load"].forEach(event =>
  window.addEventListener(event, controlRescipe)
);
elements.recipe.addEventListener("click", e => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    //button decrease is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    //button increase was clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
    listController();
  } else if (e.target.matches(".recipe__love,.recipe__love *")) {
    //Like controller
    controlLike();
  }
});
