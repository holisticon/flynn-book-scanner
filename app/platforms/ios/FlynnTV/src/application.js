import ATV from 'atvjs';
// templates
import menuTemplate from './templates/menu.jade';

let myPageStyles = `
.text-bold {
    font-weight: bold;
}
.text-white {
    color: rgb(255, 255, 255);
}
`;

App.onLaunch = function (options) {
  var home = ATV.Page.create({
    name: 'home',
    style: myPageStyles,
    template: menuTemplate,
    data: {
      items: [
        {id: 'books', title: 'Bücher'},
        {id: 'search', title: 'Suche'}
      ]
    }
  });
  ATV.Navigation.navigate('home');
};
