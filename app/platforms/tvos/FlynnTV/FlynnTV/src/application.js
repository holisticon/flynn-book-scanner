import ATV from "atvjs";
import oneUpTemplate from "./templates/oneup.jade";
import catalogTemplate from "./templates/catalog.jade";
import listTemplate from "./templates/list.jade";
const API_URL = 'https://martinreinhardt-online.de/appcms/api/public/v1/app/de.galabau-petrik.app';
const CUSTOMER_ID = '4028c5c74fe7a4a6014fe7a4ebeb0000';
const TIPPS_ID = '10cc30904ff88782014ff88ad2b50000';
const NEWS_ID = '10cc30904ff88782014ff88b735e0001';

var getImageData = function (baseURL, folder, imageName) {
  return {
    src: "file:///" + baseURL + '/images' + folder + '/' + imageName
  }
};

var convertServerResponse = function (items) {
  var result = [];
  if (items && items.length) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      item.preview = {
        url: API_URL + '/' + CUSTOMER_ID + item.thumbnailURL,
        title: item.title,
        description: item.content.replace(/<\/?[^>]+(>|$)/g, '')
      }
      result.push(item);
    }
  }
  else {
    result.push({title: 'Keine Daten verfügbar', preview: {}});
  }
  return result;
}

App.onLaunch = function (options) {

  var couchDB = options.backendURL;
  var user = options.username;
  var password = options.password;

  var COUCHDB_URL = couchDB.replace('https://','https://'+user+':'+password);

  const BASEURL = options.BASEURL + "/dist";
  var startPage = ATV.Page.create({
    name: 'start',
    template: oneUpTemplate,
    data: {
      items: [
        {
          title: 'Ihr Gärtner für Harmonie hat ein paar Kreationen aus dem bisherigen Schaffen für Sie zusammengestellt.',
          subtitle: ' Sie wollen sich in Ihrem Garten wohlfühlen? Dann holen Sie sich doch hier einfach ein paar Anregungen.',
          img: getImageData(BASEURL, '', 'teamfoto_2015.jpeg').src
        }
      ]
    }
  });
  var galleryPage = ATV.Page.create({
    name: 'gallery',
    template: catalogTemplate,
    ready(options, resolve, reject) {
      ATV
        .Ajax
        .get(COUCHDB_URL + '/_all')
        .then((xhr) => {
        // xhr succeeded
        let allDocs = xhr.response.rows;
      // call resolve with the data that will be applied to the template
      // you can even call resolve with false to skip navigation
      resolve({
        title: 'Aktuelles',
        items: convertServerResponse(allDocs)
      });
    }, (xhr) => {
      });
    }
    data: {
      title: 'Bücher',
      items: [
        {
          title: 'Privat',
          images: [
            getImageData(BASEURL, '/private', 'private_gaerten_20150721_1142473398.jpg'),
            getImageData(BASEURL, '/private', 'private_gaerten_20150721_1512454637.jpg'),
            getImageData(BASEURL, '/private', 'private_gaerten_20150721_1929839151.jpg'),
            getImageData(BASEURL, '/private', 'private_gaerten_20150721_1112079078.jpg'),
            getImageData(BASEURL, '/private', 'private_gaerten_20150721_1180585424.jpg'),
            getImageData(BASEURL, '/private', 'private_gaerten_20150721_1608334992.jpg'),
            getImageData(BASEURL, '/private', 'private_gaerten_20150721_2078023891.jpg'),
            getImageData(BASEURL, '/private', 'private_gaerten_20150721_1128460261.jpg'),
            getImageData(BASEURL, '/private', 'private_gaerten_20150721_1388068392.jpg'),
            getImageData(BASEURL, '/private', 'private_gaerten_20150721_1693052826.jpg')
          ]
        },
        {
          title: 'Öffentlich',
          images: [
            getImageData(BASEURL, '/public', 'oeffentliche_gaerten_20150721_1770677205.jpg'),
            getImageData(BASEURL, '/public', 'oeffentliche_gaerten_20150721_1992030435.jpg')
          ]
        }
      ]
    }
  });


  // create menu page
  ATV.Menu.create({
    // any attributes that you want to set on the root level menuBar element of TVML
    attributes: {},
    // array of menu item configurations
    items: [
      {id: 'start', name: 'Start', page: startPage},
      {id: 'gallery', name: 'Galerie', page: galleryPage}
    ]
  });
  ATV.Navigation.navigateToMenuPage();
};
