import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OfflineDbService {

  private readonly DB_NAME = 'TopoProOffline';

  // Se incrementa de 1 a 2 para crear el almacén de clientes
  // sin borrar los datos existentes.
  private readonly DB_VERSION = 2;

  private readonly STORE_PROYECTOS = 'proyectos';
  private readonly STORE_CLIENTES = 'clientes';
  private readonly STORE_PUNTOS = 'puntos';
  private readonly STORE_SYNC_QUEUE = 'syncQueue';

  private dbPromise: Promise<IDBDatabase> | null = null;


  // =====================================================
  // INICIALIZAR BASE DE DATOS OFFLINE
  // =====================================================

  inicializar(): Promise<void> {
    return this.abrirDB().then(() => undefined);
  }


  // =====================================================
  // ABRIR BASE DE DATOS
  // =====================================================

  private abrirDB(): Promise<IDBDatabase> {

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {

      const request = indexedDB.open(
        this.DB_NAME,
        this.DB_VERSION
      );


      // ---------------------------------------------------
      // CREAR / ACTUALIZAR ESTRUCTURA
      // ---------------------------------------------------

      request.onupgradeneeded = () => {

        const db = request.result;


        // -------------------------------------------------
        // PROYECTOS
        // -------------------------------------------------

        if (!db.objectStoreNames.contains(
          this.STORE_PROYECTOS
        )) {

          db.createObjectStore(
            this.STORE_PROYECTOS,
            {
              keyPath: 'id'
            }
          );

        }


        // -------------------------------------------------
        // CLIENTES
        // -------------------------------------------------

        if (!db.objectStoreNames.contains(
          this.STORE_CLIENTES
        )) {

          db.createObjectStore(
            this.STORE_CLIENTES,
            {
              keyPath: 'id'
            }
          );

        }


        // -------------------------------------------------
        // PUNTOS
        // -------------------------------------------------

        if (!db.objectStoreNames.contains(
          this.STORE_PUNTOS
        )) {

          const puntosStore =
            db.createObjectStore(
              this.STORE_PUNTOS,
              {
                keyPath: 'id'
              }
            );


          puntosStore.createIndex(
            'proyectoId',
            'proyectoId',
            {
              unique: false
            }
          );


          puntosStore.createIndex(
            'codigo',
            'codigo',
            {
              unique: false
            }
          );

        }


        // -------------------------------------------------
        // COLA DE SINCRONIZACIÓN
        // -------------------------------------------------

        if (!db.objectStoreNames.contains(
          this.STORE_SYNC_QUEUE
        )) {

          const syncStore =
            db.createObjectStore(
              this.STORE_SYNC_QUEUE,
              {
                keyPath: 'id',
                autoIncrement: true
              }
            );


          syncStore.createIndex(
            'estado',
            'estado',
            {
              unique: false
            }
          );


          syncStore.createIndex(
            'fecha',
            'fecha',
            {
              unique: false
            }
          );

        }

      };


      // ---------------------------------------------------
      // ÉXITO
      // ---------------------------------------------------

      request.onsuccess = () => {

        const db = request.result;

        // Si la conexión se cierra inesperadamente,
        // permitimos volver a abrirla posteriormente.
        db.onclose = () => {
          this.dbPromise = null;
        };

        resolve(db);

      };


      // ---------------------------------------------------
      // ERROR
      // ---------------------------------------------------

      request.onerror = () => {

        this.dbPromise = null;

        reject(
          request.error ||
          new Error(
            'No fue posible abrir la base de datos offline.'
          )
        );

      };

    });


    return this.dbPromise;

  }


  // =====================================================
  // GUARDAR PROYECTO
  // =====================================================

  guardarProyecto<T extends { id: number }>(
    proyecto: T
  ): Promise<void> {

    return this.guardar(
      this.STORE_PROYECTOS,
      proyecto
    );

  }


  // =====================================================
  // OBTENER PROYECTO
  // =====================================================

  obtenerProyecto<T>(
    id: number
  ): Promise<T | undefined> {

    return this.obtener<T>(
      this.STORE_PROYECTOS,
      id
    );

  }


  // =====================================================
  // OBTENER TODOS LOS PROYECTOS
  // =====================================================

  obtenerProyectos<T>(): Promise<T[]> {

    return this.obtenerTodos<T>(
      this.STORE_PROYECTOS
    );

  }


  // =====================================================
  // GUARDAR CLIENTE
  // =====================================================

  guardarCliente<T extends { id: number }>(
    cliente: T
  ): Promise<void> {

    return this.guardar(
      this.STORE_CLIENTES,
      cliente
    );

  }


  // =====================================================
  // OBTENER CLIENTE
  // =====================================================

  obtenerCliente<T>(
    id: number
  ): Promise<T | undefined> {

    return this.obtener<T>(
      this.STORE_CLIENTES,
      id
    );

  }


  // =====================================================
  // OBTENER TODOS LOS CLIENTES
  // =====================================================

  obtenerClientes<T>(): Promise<T[]> {

    return this.obtenerTodos<T>(
      this.STORE_CLIENTES
    );

  }


  // =====================================================
  // ELIMINAR CLIENTE
  // =====================================================

  eliminarCliente(
    id: number
  ): Promise<void> {

    return this.eliminar(
      this.STORE_CLIENTES,
      id
    );

  }


  // =====================================================
  // GUARDAR PUNTO
  // =====================================================

  guardarPunto<T extends { id: number }>(
    punto: T
  ): Promise<void> {

    return this.guardar(
      this.STORE_PUNTOS,
      punto
    );

  }


  // =====================================================
  // OBTENER PUNTO
  // =====================================================

  obtenerPunto<T>(
    id: number
  ): Promise<T | undefined> {

    return this.obtener<T>(
      this.STORE_PUNTOS,
      id
    );

  }


  // =====================================================
  // OBTENER PUNTOS DE UN PROYECTO
  // =====================================================

  obtenerPuntosPorProyecto<T>(
    proyectoId: number
  ): Promise<T[]> {

    return this.abrirDB()
      .then(db => {

        return new Promise<T[]>(
          (resolve, reject) => {

            const transaction =
              db.transaction(
                this.STORE_PUNTOS,
                'readonly'
              );


            const store =
              transaction.objectStore(
                this.STORE_PUNTOS
              );


            const index =
              store.index('proyectoId');


            const request =
              index.getAll(proyectoId);


            request.onsuccess = () => {

              resolve(
                request.result as T[]
              );

            };


            request.onerror = () => {

              reject(
                request.error ||
                new Error(
                  'No fue posible obtener los puntos offline.'
                )
              );

            };

          }
        );

      });

  }


  // =====================================================
  // ELIMINAR PUNTO
  // =====================================================

  eliminarPunto(
    id: number
  ): Promise<void> {

    return this.eliminar(
      this.STORE_PUNTOS,
      id
    );

  }


  // =====================================================
  // ELIMINAR PROYECTO
  // =====================================================

  eliminarProyecto(
    id: number
  ): Promise<void> {

    return this.eliminar(
      this.STORE_PROYECTOS,
      id
    );

  }


  // =====================================================
  // AGREGAR A COLA DE SINCRONIZACIÓN
  // =====================================================

  agregarACola<T>(
    operacion: T
  ): Promise<void> {

    return this.abrirDB()
      .then(db => {

        return new Promise<void>(
          (resolve, reject) => {

            const transaction =
              db.transaction(
                this.STORE_SYNC_QUEUE,
                'readwrite'
              );


            const store =
              transaction.objectStore(
                this.STORE_SYNC_QUEUE
              );


            store.add(operacion);


            transaction.oncomplete = () => {

              resolve();

            };


            transaction.onerror = () => {

              reject(
                transaction.error ||
                new Error(
                  'No fue posible guardar la operación pendiente.'
                )
              );

            };

          }
        );

      });

  }


  // =====================================================
  // OBTENER COLA DE SINCRONIZACIÓN
  // =====================================================

  obtenerCola<T>(): Promise<T[]> {

    return this.abrirDB()
      .then(db => {

        return new Promise<T[]>(
          (resolve, reject) => {

            const transaction =
              db.transaction(
                this.STORE_SYNC_QUEUE,
                'readonly'
              );


            const store =
              transaction.objectStore(
                this.STORE_SYNC_QUEUE
              );


            const request =
              store.getAll();


            request.onsuccess = () => {

              resolve(
                request.result as T[]
              );

            };


            request.onerror = () => {

              reject(
                request.error ||
                new Error(
                  'No fue posible obtener la cola de sincronización.'
                )
              );

            };

          }
        );

      });

  }


  // =====================================================
  // ELIMINAR OPERACIÓN DE LA COLA
  // =====================================================

  eliminarDeCola(
    id: number
  ): Promise<void> {

    return this.eliminar(
      this.STORE_SYNC_QUEUE,
      id
    );

  }


  // =====================================================
  // GUARDAR GENÉRICO
  // =====================================================

  private guardar<T>(
    storeName: string,
    dato: T
  ): Promise<void> {

    return this.abrirDB()
      .then(db => {

        return new Promise<void>(
          (resolve, reject) => {

            const transaction =
              db.transaction(
                storeName,
                'readwrite'
              );


            const store =
              transaction.objectStore(
                storeName
              );


            store.put(dato);


            transaction.oncomplete = () => {

              resolve();

            };


            transaction.onerror = () => {

              reject(
                transaction.error ||
                new Error(
                  'No fue posible guardar el dato offline.'
                )
              );

            };

          }
        );

      });

  }


  // =====================================================
  // OBTENER GENÉRICO
  // =====================================================

  private obtener<T>(
    storeName: string,
    id: number
  ): Promise<T | undefined> {

    return this.abrirDB()
      .then(db => {

        return new Promise<T | undefined>(
          (resolve, reject) => {

            const transaction =
              db.transaction(
                storeName,
                'readonly'
              );


            const store =
              transaction.objectStore(
                storeName
              );


            const request =
              store.get(id);


            request.onsuccess = () => {

              resolve(
                request.result as T | undefined
              );

            };


            request.onerror = () => {

              reject(
                request.error ||
                new Error(
                  'No fue posible obtener el dato offline.'
                )
              );

            };

          }
        );

      });

  }


  // =====================================================
  // OBTENER TODOS GENÉRICO
  // =====================================================

  private obtenerTodos<T>(
    storeName: string
  ): Promise<T[]> {

    return this.abrirDB()
      .then(db => {

        return new Promise<T[]>(
          (resolve, reject) => {

            const transaction =
              db.transaction(
                storeName,
                'readonly'
              );


            const store =
              transaction.objectStore(
                storeName
              );


            const request =
              store.getAll();


            request.onsuccess = () => {

              resolve(
                request.result as T[]
              );

            };


            request.onerror = () => {

              reject(
                request.error ||
                new Error(
                  'No fue posible obtener los datos offline.'
                )
              );

            };

          }
        );

      });

  }


  // =====================================================
  // ELIMINAR GENÉRICO
  // =====================================================

  private eliminar(
    storeName: string,
    id: number
  ): Promise<void> {

    return this.abrirDB()
      .then(db => {

        return new Promise<void>(
          (resolve, reject) => {

            const transaction =
              db.transaction(
                storeName,
                'readwrite'
              );


            const store =
              transaction.objectStore(
                storeName
              );


            store.delete(id);


            transaction.oncomplete = () => {

              resolve();

            };


            transaction.onerror = () => {

              reject(
                transaction.error ||
                new Error(
                  'No fue posible eliminar el dato offline.'
                )
              );

            };

          }
        );

      });

  }

}
