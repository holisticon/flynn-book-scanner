using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Navigation;

namespace WPCordovaClassLib.Cordova.Commands
{


    class CustomUriMapper : UriMapperBase
    {
      
        public static string tempUri;
     

        public override Uri MapUri(Uri uri)
        {
            tempUri = System.Net.HttpUtility.UrlDecode(uri.ToString());

            if (tempUri.Contains("shopincomo"))
            {
              
                return new Uri("/MainPage.xaml?parameter=" + tempUri, UriKind.Relative);
            }

                 return uri;
            //else
            //{
            //    //return new Uri("/MainPage.xaml", UriKind.Relative);
            //}
        }
    }


}


