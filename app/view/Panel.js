Ext.define('voc_trainer.view.Panel', {
    extend: 'Ext.tab.Panel',
    xtype: 'panel',
    
    config: {
        title: 'Panel',
        tabBarPosition: 'bottom',

        items: [
            {
                title: 'Anleitung',
                iconCls: 'info',
                xtype: 'anleitung'
            },
            {
                title: 'Karteiverwaltung',
                iconCls: 'list',
                xtype: 'karteiverwaltung'
            },
            {
                title: 'Einstellungen',
                iconCls: 'settings',
                xtype: 'einstellungen'
            }
        ]
    }
});
