//imports
const path = require('path');
const url = require('url');
const sqlite3 = require("sqlite3");
const knex = require("knex")({
    client: "sqlite3",
    connection:{
        filename:"./food.db"
    },
    useNullAsDefault: true
});

//require('electron-reload')(__dirname);

//deconstruct imports
const { app, BrowserWindow, Menu, ipcMain } = require('electron');

//variables for windows
let mainWindow;
let addWindow;
let updateWindow;
let deleteWindow;

//function to create main window
function createWindow() {
  mainWindow = new BrowserWindow( {
    width: 1350,
    height: 960,
    resizable: false,
    icon: 'images/food.png',
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadFile('mainwindow.html')

  mainWindow.webContents.on('did-finish-load', function() {
    readDB();
  });
  
  mainWindow.on('closed', function() {
    app.quit();
  });


  ipcMain.on('item:add', function(e, item) {
    console.log(item);
    knex('food').insert(item).then((newFood)=>{
      knex.select("*").from('food').where({id: newFood[0]}).then(function(rows){
        mainWindow.webContents.send('item:add', rows);
       addWindow.close();
      })
    }) 
  });
  ipcMain.on('window:close', function() {
    deleteWindow.close();
  })


  ipcMain.on('item:update', function(e, updateID) {

    createUpdateWindow();
    updateWindow.webContents.once('dom-ready', function(){
      knex.select().from('food').where('id', updateID )
      .then(updateID => updateWindow.webContents.send('item:add', updateID[0]))
      .catch(function(err){
        console.error(err);
      });

    }
    
  );
  }) 
    
    
  ipcMain.on('item:delete', function(e, deleteID) {
    console.log(deleteID);

    knex('food').where({ id: deleteID }).del().then(()=>{
      readDB();
    }).catch(function(err) {
      console.log(err.stack);
    });
  }) 

  ipcMain.on('food:delete', function(e, deleteID) {
    deleteWindow.close();

    knex('food').where({id:deleteID}).del().then(()=>{
      readDB();
    })
  })

  ipcMain.on('food:update', function(e, food, updateID) {
    updateWindow.close();

    console.log(food);
    console.log(updateID);

    knex('food').where({id:updateID}).update(food).then(()=>{
      readDB();
    })
  })

  let menu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(menu)

}//end createWindow

//function to create window for Adding
function createAddWindow() {
  addWindow = new BrowserWindow({
    width: 400,
    height: 670,
    icon: 'images/food.png',
    title: 'Add Item',
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  addWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'addwindow.html'),
    protocol: 'file:',
    slashes: true
  }));

  addWindow.on('close', function() {
    addWindow = null;
  });

}//end create addWindow
function createUpdateWindow() {
  updateWindow = new BrowserWindow({
    width: 400,
    height: 670,
    icon: 'images/food.png',
    title: 'Add Item',
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  updateWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'updateWindow.html'),
    protocol: 'file:',
    slashes: true
  }));

  updateWindow.on('close', function() {
    updateWindow = null;
  });

}//end create addWindow


function clearWindow()
{
    mainWindow.webContents.send('item:clear');
}//end function clearWindow


function readDB() {
 
    mainWindow.webContents.send('item:clear');
//add try catch (copy to all)
    let result= knex.select("*").from("food")
    result.then(function(rows){
    mainWindow.webContents.send('item:add',rows);
  })
}


//template for menu
const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Add New Entry',
        click() {createAddWindow()}
      },
      {
        label: 'Quit',
        click(){app.quit()
        },
        accelerator: 'Crtl+Q'
      }
    ]
  },
  {
    label: 'Dev',
    submenu: [
      {
        role: 'toggledevtools'
      }
    ]
  }
];

app.on('ready', createWindow)
