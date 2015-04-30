from fabric.api import env, put, run, task, local, sudo, prompt, lcd, settings
from fabric.contrib.project import rsync_project
import datetime, os, json, ast, ConfigParser
from jinja2 import Environment, PackageLoader, FileSystemLoader

CURRENT_PATH = os.path.abspath(os.path.dirname(__file__))
PROJ4JS_VERSION = "1.1.0"

config = None

@task
def install(app='src'):
    bower_home = os.sep.join((CURRENT_PATH, 'bower_components'))
    with lcd(CURRENT_PATH):
        _check_command('npm')
        local("npm install")
        _check_command('bower')
        local("bower install")

    npm_bin = os.sep.join(("node_modules", ".bin"))

    js_ext = os.sep.join((app, 'js', 'ext'))
    css_ext = os.sep.join((app, 'css', 'ext'))
    if os.path.exists(css_ext):
        local('rm -r {0}'.format(css_ext))
    local('mkdir {0}'.format(css_ext))
    local('mkdir {0}'.format(os.sep.join((css_ext, 'images'))))

    if os.path.exists(js_ext):
        local('rm -r {0}'.format(js_ext))
    local('mkdir {0}'.format(js_ext))

    bower = json.loads(open('bower.json').read())

    # generate config js
    generate_config_js()


    def _get_dest_path(path):
        if path.endswith("js"):
            return js_ext
        elif path.endswith("css"):
            return css_ext

    paths = ast.literal_eval(local('bower -j list -p', capture=True))
    print paths
    for path in paths:
      if isinstance(paths[path], list):
          for subpath in paths[path]:
              _copy_lib(npm_bin, subpath, os.sep.join((_get_dest_path(subpath), os.path.basename(subpath))))
      else:
          subpath = paths[path]
          fileName, fileExtension = os.path.splitext(os.path.basename(subpath))
          if fileExtension != "":
              _copy_lib(npm_bin, subpath, os.sep.join((_get_dest_path(subpath), os.path.basename(subpath))))

    for dep in bower['dependency_locations']:
        files = bower['dependency_locations'][dep]
        version = bower['dependencies'][dep]
        for f in files:
            f = f.replace('x.x', version)
            src = os.sep.join((bower_home, dep, f))
            f_name = dep.replace('-bower', '')
            if f[len(f) - 2:] == 'js':
                dest = os.sep.join((js_ext, '{0}.js'.format(f_name)))
                local('{0} {1} -o {2}'.format(os.sep.join((npm_bin, 'uglifyjs')), src, dest))
            elif f[len(f) - 3:] == 'css':
                dest = os.sep.join((css_ext, '{0}.css'.format(f_name)))
                local('{0} {1} -o {2}'.format(os.sep.join((npm_bin, 'cleancss')), src, dest))
            else:
                dest = os.sep.join((css_ext, '{0}'.format(os.path.basename(f))))
                local('cp -r {0} {1}'.format(src, dest))

    #extra libs
    #proj4js
    dist_path = os.sep.join((os.environ['HOME'], 'apps'))
    if not os.path.exists(dist_path):
        local('mkdir {0}'.format(dist_path))
    proj_dir = 'proj4js'.format(PROJ4JS_VERSION)
    proj_path = os.sep.join((dist_path, proj_dir))
    if not os.path.exists(proj_path):
        #install proj4js
        with lcd(dist_path):
            local('wget http://download.osgeo.org/proj4js/proj4js-{0}.zip'.format(PROJ4JS_VERSION))
            local('unzip proj4js-{0}.zip'.format(PROJ4JS_VERSION))

    #copy it to ext folder
    with lcd(CURRENT_PATH):
        local('cp {0} {1}'.format(os.sep.join((proj_path, 'lib', 'proj4js-compressed.js')), os.sep.join((js_ext, 'proj4js.js'))))

    #openlayers
    ol_path = os.sep.join((bower_home, 'openlayers'))
    with lcd(os.sep.join((ol_path, 'build'))):
        cfg_file = os.sep.join((CURRENT_PATH, 'etc', 'openlayers.cfg'))
        js_mobile = os.sep.join((CURRENT_PATH, js_ext, 'openlayers.js'))
        local('./build.py %s %s' % (cfg_file, js_mobile))

    with lcd(CURRENT_PATH):
        local('cp -r {0} {1}'.format(os.sep.join((ol_path, 'theme')), app))
        local('cp -r {0}/* {1}'.format(os.sep.join((ol_path, 'img')), os.sep.join((app, 'img'))))


def _copy_lib(npm_bin, src_path, dest_path):
    """ copy file, uglify if it is js, cleancss if it is css """
    if src_path.endswith(".js"):
        if ".min." in src_path:
            local('cp {0} {1}'.format(src_path, dest_path))
        else:
            local('{0} {1} -o {2}'.format(os.sep.join((npm_bin, 'uglifyjs')), src_path, dest_path))
    elif src_path.endswith(".css"):
        local('{0} {1} -o {2}'.format(os.sep.join((npm_bin, 'cleancss')), src_path, dest_path))


def _check_command(cmd):
    """checks a command is in the path"""
    with settings(warn_only=True):
        out = local('command -v {0}'.format(cmd), capture=True)
        if out.return_code != 0:
            print '{0} needs to be installed and in your path'.format(cmd)
            exit(0)

@task
def server(server='beta'):
    """Defines server environment"""
    env.hosts = [_config('hosts', section=server),]
    env.user = _config('user', section=server)
    env.home = "/home/%s" % env.user
    env.html_current_path = _config('html_path')
    env.port = _config('port', section=server)
    _set_server()

def _set_server():
    """Defines devel environment"""
    env.base_dir = "%(home)s/dist" % {'home': env.home}
    env.app_name = "authoring_tool"
    env.app_local_name = "src"
    env.domain_path = "%(base_dir)s/%(app_name)s" % { 'base_dir':env.base_dir, 'app_name':env.app_name }
    env.current_path = "%(domain_path)s/current" % { 'domain_path':env.domain_path }
    env.releases_path = "%(domain_path)s/releases" % { 'domain_path':env.domain_path }
    env.app_local = "./%(app_name)s" % { 'app_name':env.app_local_name }

def _setup():
    """Prepare server for deployment"""
    run("mkdir -p %(domain_path)s" % { 'domain_path':env.domain_path })
    run("mkdir -p %(releases_path)s" % { 'releases_path':env.releases_path })

@task
def deploy():
    """Deploys your project, updates the virtual env then restarts"""
    _setup()
    _update()

def _update():
    """Copies your project and updates environment and symlink"""
    _checkout()
    _symlink()

def _checkout():
    """Checkout code to the remote servers"""
    #env.current_release = "%(releases_path)s/%(time).0f" % { 'releases_path':env.releases_path, 'time':time() }
    refspec = _find_version()
    env.current_release = "%(releases_path)s/%(release)s" % { 'releases_path':env.releases_path, 'release': refspec }
    run("mkdir -p %(current_release)s" % { 'current_release':env.current_release })
    print env.app_local, env.current_release
    #put("%(app_local)s" % { 'app_local':env.app_local }, "%(current_release)s" % { 'current_release':env.current_release })
    rsync_project(local_dir=env.app_local_name, remote_dir=env.current_release, exclude='.git,.pyc,.gitignore')

def _find_version():
    refspec = local('git tag | sort -V | tail -1 | cut -d"v" -f2', capture=True)
    print "Showing the last 5 tags"
    local('git tag | sort -V | tail -5')
    #create_tag = prompt('Tag this release? [y/N]')
    #if create_tag.lower() == 'y':
    #    notify("Showing latest tags for reference")
    #    refspec = prompt('Tag name [in format x.x.x for general tagging or x.x.x.x for pcapi tagging]? ')
    #    local('git tag %(ref)s -m "Tagging version %(ref)s in fabfile"' % {'ref': refspec})
    #    local('git push --tags')
    #else:
    #    use_commit = prompt('Build from a specific commit? [y/N] ')
    #    if use_commit.lower() == 'y':
    #        refspec = prompt('Choose commit to build from [in format x.x.x]: ')
    #        local('git stash save')
    #        local('git checkout v%s' % refspec)
    #        print "Don't forget to run the command <git stash pop> after the app is installed"
    #    else:
    refspec = prompt('Create dev folder to build in [e.g. dev]: ')
    return refspec

def _symlink():
    """Updates the symlink to the most recently deployed version"""
    print "You need to symlink your app that exists here "
    print "%(current_release)s" % { 'current_release':env.current_release}
    print "with your apache folder that serves static pages by running the commands: "
    print "*********************************************************"
    print "if [ -d %(current_path)s ]; then rm %(current_path)s; fi" % { 'current_path':env.html_current_path }
    print "ln -s %(current_release)s %(current_path)s" % { 'current_release':env.current_release, 'current_path':env.html_current_path }
    print "*********************************************************"


###Configuration
@task
def generate_config_js(version=None, fetch_config=True):
    """ generate config.js """
    root, proj_home, src_dir = _get_source()

    if fetch_config:
        _check_config()

    # using config initialises it
    _config('baseurl', 'config')

    ## convert items list into dictionary
    values = {}
    versions = {}
    # #for entry in config.items('app'):
    for entry in config.items('config'):
        print entry
        values[str(entry[0])] = str(entry[1])
       # for versionNo in config.get("config", "versions").split(","):
          #  print "version : " + versionNo
          #  versions = versionNo
    templates = os.sep.join((src_dir, 'templates'))
    #values['version'] = versions
    out_file = os.sep.join((src_dir, 'js', 'config.js'))
    environ = Environment(loader=FileSystemLoader(templates))
    template = environ.get_template("config.js")
    output = template.render(config=values)
    _write_data(out_file, output)


def _get_source(app='android'):
    """
    Get fieldtip source directories.
    Returns a tuple containing:

    0) root                   (of source repo)
    1) project home           (of project repo)
    2) source code            (src)
    """

    root = local('pwd', capture=True).strip();
    proj_home = os.sep.join((root, 'project'))
    src_dir = os.sep.join((root, 'src'))
    return root, proj_home, src_dir

def _check_config():
    """
    If config.ini exists update from remote location, otherwise prompt user for location
    """
    global config

    proj_home = _get_source()[0]
    conf_dir = os.sep.join((CURRENT_PATH, 'etc'))
    conf_file = os.sep.join((conf_dir, 'config.ini'))
    if not os.path.exists(conf_file):
        msg = '\nProvide location of config file > '
        answer = raw_input(msg).strip()
        if len(answer) > 0:
            if answer.find('@') == -1:
                if os.path.exists(answer):
                    local('cp {0} {1}'.format(answer, conf_file))
                else:
                    print "File not found, can't continue."
                    exit(0)
            else:
                local('scp {0} {1}'.format(answer, conf_dir))

    location = _config('location')
    if location.find('@') != -1:
        # pick up any changes
        location = _config('location')
        local('scp {0} {1}'.format(location, conf_file))

    config = None # make sure it is re-read

def _config(key, section='install'):
    """
    Get config value for key.

    key - config key
    section - config section, e.g install, release or app
    """

    global config
    if config == None:
        config = ConfigParser.ConfigParser()
        conf_file = os.sep.join((_get_source()[0], 'etc', 'config.ini'))
        config.read(conf_file)

    if config.has_section(section):
        if key == None:
            return config._sections[section]
        else:
            val = None
            try:
                val = config.get(section, key)
            except NoOptionError:
                pass
            return val
    else:
        return None

def _write_data(fil, filedata):
    """ TODO """
    f = open(fil, 'w')
    f.write(filedata)
    f.close()
